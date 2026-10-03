# Database Indexing Lab — EV Charging Network

ทดลองสร้าง index ใน PostgreSQL 16 แล้ววัดผลด้วย `EXPLAIN ANALYZE` ก่อนและหลังสร้าง index

## 1. ข้อมูลทดสอบ

- ตาราง `bookings` จำนวน 600,007 แถว (สร้างเพิ่มด้วย `generate_series` สุ่ม user, charger, วันที่, status)
- 11 users ละประมาณ 54,000 แถว, status 3 ค่า ค่าละประมาณ 200,000 แถว
- รัน `ANALYZE bookings;` ก่อนวัดผลทุกครั้ง
- ก่อนทดลองมีเฉพาะ index เดี่ยวบน `user_id`, `station_id`, `charger_id` และ primary key

## 2. Query และ index ที่ทดลอง

Query A (ประวัติการจองของผู้ใช้):

    SELECT * FROM bookings
    WHERE user_id = 1 AND status = 'confirmed'
    ORDER BY created_at DESC LIMIT 20;

Query B (การจองตามวันที่และสถานะ):

    SELECT * FROM bookings
    WHERE reservation_date = to_char(current_date + 5, 'YYYY-MM-DD')
      AND status = 'confirmed';

Index ที่สร้าง:

    CREATE INDEX idx_bookings_user_status_created ON bookings (user_id, status, created_at DESC);
    CREATE INDEX idx_bookings_date_status ON bookings (reservation_date, status);

## 3. ผลการทดลอง

| Query | ก่อนมี index | หลังมี index | เร็วขึ้น |
|---|---|---|---|
| A: ประวัติการจองของ user | 83.843 ms | 0.354 ms | ประมาณ 237 เท่า |
| B: จองตามวันที่ + status | 77.780 ms | 36.502 ms | ประมาณ 2.1 เท่า |

Query A: ก่อนมี index ใช้ Bitmap Heap Scan กับ index เดี่ยวของ user_id อ่าน 54,424 แถว ทิ้ง 36,355 แถวที่ status ไม่ตรง แล้วต้อง Sort เอง หลังมี composite index เป็น Index Scan ไม่มี Sort อ่านแค่ 20 แถว

Query B: ก่อนมี index เป็น Parallel Seq Scan อ่านทั้งตาราง หลังมี index เป็น Bitmap Index Scan หาแถวใน index ได้ประมาณ 2 ms แต่ต้องดึงข้อมูลจริง 3,330 แถวจาก 2,688 blocks จึงเร็วขึ้นไม่มากเท่า Query A

## 4. ขนาดของ index

| Index | ขนาด |
|---|---|
| bookings_pkey | 19 MB |
| ix_bookings_charger_id | 5,944 kB |
| ix_bookings_user_id | 5,696 kB |
| ix_bookings_station_id | 5,768 kB |
| idx_bookings_user_status_created (ใหม่) | 23 MB |
| idx_bookings_date_status (ใหม่) | 4,272 kB |

## 5. ข้อสรุป

1. Composite index ที่เรียงคอลัมน์ตาม query (เงื่อนไข = ก่อน แล้วตามด้วยคอลัมน์ ORDER BY) ให้ผลดีที่สุด เพราะไม่ต้อง Sort และอ่านแค่แถวที่ต้องการ
2. Index เดี่ยวช่วยได้ไม่เต็มที่ ยังต้องกรองและเรียงเอง
3. ถ้า query ต้องดึงแถวจำนวนมาก ประโยชน์ของ index ลดลง เพราะคอขวดย้ายไปที่การอ่านข้อมูลจริง
4. Index มีต้นทุน คือใช้พื้นที่เพิ่ม และทุก INSERT/UPDATE/DELETE ต้องอัปเดต index ด้วย
5. ลำดับคอลัมน์ใน composite index สำคัญ (leftmost prefix rule)
6. ข้อมูลต้องมากพอและต้อง ANALYZE ไม่งั้น planner อาจเลือก Seq Scan หรือแผนที่ผิด

## 6. การนำไปใช้ในโปรเจคจริง

ตรวจ query ที่แอปรันจริงใน `backend/app/services/crud.py` พบ 3 query ที่กรอง `user_id` แล้วเรียงตามเวลาล่าสุด จึงเพิ่ม composite index ใน `backend/app/models/entities.py`:

| ตาราง | Query ในโค้ด | Index ที่เพิ่ม |
|---|---|---|
| bookings | WHERE user_id = ? ORDER BY created_at DESC | idx_bookings_user_created (user_id, created_at) |
| charging_sessions | WHERE user_id = ? ORDER BY started_at DESC | idx_sessions_user_started (user_id, started_at) |
| payments | WHERE user_id = ? ORDER BY created_at DESC | idx_payments_user_created (user_id, created_at) |

หมายเหตุ:

- ไม่ระบุ DESC ใน index เพราะ PostgreSQL อ่าน index ย้อนกลับเพื่อรองรับ ORDER BY ... DESC ได้
- ไม่นำ idx_bookings_date_status มาใช้ เพราะแอปไม่มี query ที่กรองตามวันที่ และไม่ใส่ status ใน index ของ bookings เพราะแอปไม่ได้กรองด้วย status
- SQLModel สร้าง index ตอนสร้างตารางใหม่เท่านั้น database ที่มีตารางอยู่แล้วต้องสร้างใหม่หรือรัน CREATE INDEX เอง
- การค้นหาชื่อสถานีด้วย ILIKE '%...%' ใช้ B-tree ไม่ได้ ถ้าข้อมูลเยอะขึ้นควรใช้ GIN index กับ pg_trgm
