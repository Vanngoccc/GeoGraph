// =====================================================================
// KỊCH BẢN NẠP DỮ LIỆU ĐỒ THỊ TRI THỨC HÌNH HỌC PHẲNG (GEOGRAPH - TỨ GIÁC)
// Sinh viên thực hiện: Huỳnh Văn Ngọc - MSSV: 2001230572
// Hệ quản trị CSDL: Neo4j Graph Database
// =====================================================================

// 1. TẠO RÀNG BUỘC DUY NHẤT (CONSTRAINTS)
CREATE CONSTRAINT shape_id_unique IF NOT EXISTS FOR (s:Shape) REQUIRE s.id IS UNIQUE;

// 2. TẠO NHÓM HÌNH HỌC
MERGE (c1:ShapeCategory {id: 'CAT_QUAD', name: 'Tứ giác', description: 'Các đa giác phẳng có bốn cạnh và bốn đỉnh.'});

// 3. NẠP CÁC NODE HÌNH HỌC (THUẦN TỨ GIÁC)
MERGE (s0:Shape { id: 'SHAPE_CONVEX_QUAD', name: 'Tứ giác', name_en: 'Quadrilateral', definition: 'Tứ giác là hình gồm bốn đoạn thẳng, trong đó bất kì hai đoạn thẳng nào cũng không cùng nằm trên một đường thẳng.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 1, trang 58', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#64748b' }) MERGE (s0)-[:BELONGS_TO]->(c1);

MERGE (s1:Shape { id: 'SHAPE_SQUARE', name: 'Hình vuông', name_en: 'Square', definition: 'Hình vuông là tứ giác có bốn góc vuông và bốn cạnh bằng nhau.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: true, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 5, trang 75', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#4f46e5' }) MERGE (s1)-[:BELONGS_TO]->(c1);

MERGE (s2:Shape { id: 'SHAPE_RECTANGLE', name: 'Hình chữ nhật', name_en: 'Rectangle', definition: 'Hình chữ nhật là tứ giác có bốn góc vuông.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 4, trang 70', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#0284c7' }) MERGE (s2)-[:BELONGS_TO]->(c1);

MERGE (s3:Shape { id: 'SHAPE_RHOMBUS', name: 'Hình thoi', name_en: 'Rhombus', definition: 'Hình thoi là tứ giác có bốn cạnh bằng nhau.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 4, trang 72', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#7c3aed' }) MERGE (s3)-[:BELONGS_TO]->(c1);

MERGE (s4:Shape { id: 'SHAPE_PARALLELOGRAM', name: 'Hình bình hành', name_en: 'Parallelogram', definition: 'Hình bình hành là tứ giác có các cặp cạnh đối song song.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 3, trang 66', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#059669' }) MERGE (s4)-[:BELONGS_TO]->(c1);

MERGE (s5:Shape { id: 'SHAPE_TRAPEZOID', name: 'Hình thang', name_en: 'Trapezoid', definition: 'Hình thang là tứ giác có hai cạnh đối song song.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 2, trang 61', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#d97706' }) MERGE (s5)-[:BELONGS_TO]->(c1);

MERGE (s6:Shape { id: 'SHAPE_ISOSCELES_TRAPEZOID', name: 'Hình thang cân', name_en: 'Isosceles trapezoid', definition: 'Hình thang cân là hình thang có hai góc kề một đáy bằng nhau.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 2, trang 63', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#0d9488' }) MERGE (s6)-[:BELONGS_TO]->(c1);

MERGE (s7:Shape { id: 'SHAPE_RIGHT_TRAPEZOID', name: 'Hình thang vuông', name_en: 'Right trapezoid', definition: 'Hình thang vuông là hình thang có một góc vuông.', sides_count: 4, vertices_count: 4, sum_interior_angles: 360, is_regular: false, source_id: 'SGK Toán 8 - Kết nối tri thức', source_locator: 'Chương 3, bài 2, trang 62', status: 'APPROVED', verified_by: 'GV. Trần Quý Ban', color: '#64748b' }) MERGE (s7)-[:BELONGS_TO]->(c1);

// 4. THIẾT LẬP QUAN HỆ CHUYỂN ĐỔI (TRANSFORMS_TO)
MATCH (a:Shape {id: 'SHAPE_CONVEX_QUAD'}), (b:Shape {id: 'SHAPE_TRAPEZOID'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có hai cạnh đối song song'}]->(b);
MATCH (a:Shape {id: 'SHAPE_TRAPEZOID'}), (b:Shape {id: 'SHAPE_ISOSCELES_TRAPEZOID'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có hai góc kề một đáy bằng nhau hoặc hai đường chéo bằng nhau'}]->(b);
MATCH (a:Shape {id: 'SHAPE_TRAPEZOID'}), (b:Shape {id: 'SHAPE_RIGHT_TRAPEZOID'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có một góc vuông'}]->(b);
MATCH (a:Shape {id: 'SHAPE_TRAPEZOID'}), (b:Shape {id: 'SHAPE_PARALLELOGRAM'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có hai cạnh bên song song'}]->(b);
MATCH (a:Shape {id: 'SHAPE_ISOSCELES_TRAPEZOID'}), (b:Shape {id: 'SHAPE_RECTANGLE'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có một góc vuông'}]->(b);
MATCH (a:Shape {id: 'SHAPE_RIGHT_TRAPEZOID'}), (b:Shape {id: 'SHAPE_RECTANGLE'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có thêm góc vuông thứ hai ở đáy đối diện'}]->(b);
MATCH (a:Shape {id: 'SHAPE_PARALLELOGRAM'}), (b:Shape {id: 'SHAPE_RECTANGLE'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có một góc vuông hoặc hai đường chéo bằng nhau'}]->(b);
MATCH (a:Shape {id: 'SHAPE_PARALLELOGRAM'}), (b:Shape {id: 'SHAPE_RHOMBUS'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc'}]->(b);
MATCH (a:Shape {id: 'SHAPE_RECTANGLE'}), (b:Shape {id: 'SHAPE_SQUARE'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc'}]->(b);
MATCH (a:Shape {id: 'SHAPE_RHOMBUS'}), (b:Shape {id: 'SHAPE_SQUARE'}) MERGE (a)-[:TRANSFORMS_TO {condition: 'Có một góc vuông hoặc hai đường chéo bằng nhau'}]->(b);
