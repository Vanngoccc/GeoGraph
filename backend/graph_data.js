module.exports = {
  "categories": [
    {
      "id": "CAT_QUAD",
      "name": "Tứ giác",
      "description": "Hệ thống các loại tứ giác lồi trong hình học phẳng."
    }
  ],
  "shapes": [
    {
      "id": "SHAPE_SQUARE",
      "name": "Hình vuông",
      "name_en": "Square",
      "category": "CAT_QUAD",
      "definition": "Hình vuông là tứ giác có bốn góc vuông và bốn cạnh bằng nhau.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": true,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 5, trang 75",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#4f46e5",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Bốn cạnh có độ dài bằng nhau từng đôi một.",
          "expr": "AB = BC = CD = DA"
        },
        {
          "category": "Góc",
          "description": "Bốn góc vuông bằng nhau và đều bằng 90 độ.",
          "expr": "∠A = ∠B = ∠C = ∠D = 90°"
        },
        {
          "category": "Đường chéo",
          "description": "Hai đường chéo bằng nhau, vuông góc tại trung điểm của mỗi đường và là đường phân giác của các góc.",
          "expr": "AC = BD, AC ⊥ BD tại O"
        },
        {
          "category": "Đối xứng",
          "description": "Có một tâm đối xứng (giao điểm hai đường chéo) và bốn trục đối xứng.",
          "expr": "1 tâm đối xứng, 4 trục đối xứng"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = 4a",
          "expression": "4 * a",
          "params": [
            {
              "name": "a",
              "label": "Độ dài cạnh (a)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = a^2",
          "expression": "a * a",
          "params": [
            {
              "name": "a",
              "label": "Độ dài cạnh (a)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Hình chữ nhật có hai cạnh kề bằng nhau là hình vuông.",
          "guide": "Chứng minh tứ giác là hình chữ nhật trước, sau đó chỉ ra thêm hai cạnh kề bằng nhau."
        },
        {
          "order": 2,
          "condition": "Hình chữ nhật có hai đường chéo vuông góc với nhau là hình vuông.",
          "guide": "Chứng minh tứ giác là hình chữ nhật, rồi chứng minh thêm hai đường chéo vuông góc."
        },
        {
          "order": 3,
          "condition": "Hình thoi có một góc vuông là hình vuông.",
          "guide": "Chứng minh tứ giác là hình thoi, sau đó chỉ ra một góc trong bằng 90 độ."
        },
        {
          "order": 4,
          "condition": "Hình thoi có hai đường chéo bằng nhau là hình vuông.",
          "guide": "Chứng minh tứ giác là hình thoi, sau đó chứng minh độ dài hai đường chéo bằng nhau."
        }
      ],
      "tips": [
        {
          "type": "Thơ ghi nhớ",
          "title": "Bài thơ diện tích hình vuông",
          "content": "Muốn tính diện tích hình vuông\nCạnh nhân chính nó bốn phương vẹn toàn\nChu vi chẳng ngại lo toan\nMột cạnh nhân bốn tính toan tức thì."
        },
        {
          "type": "Cảnh giác bẫy",
          "title": "Bẫy nhận biết hình vuông và hình thoi",
          "content": "Bẫy đề thi hay gặp: Thấy tứ giác có bốn cạnh bằng nhau vội vàng kết luận ngay là hình vuông. Hãy nhớ: bốn cạnh bằng nhau mới chỉ là hình thoi, cần thêm một góc vuông hoặc hai đường chéo bằng nhau mới là hình vuông."
        }
      ],
      "parents": [
        "SHAPE_RECTANGLE",
        "SHAPE_RHOMBUS"
      ],
      "svg_type": "square"
    },
    {
      "id": "SHAPE_RECTANGLE",
      "name": "Hình chữ nhật",
      "name_en": "Rectangle",
      "category": "CAT_QUAD",
      "definition": "Hình chữ nhật là tứ giác có bốn góc vuông.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 4, trang 70",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#0284c7",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Các cặp cạnh đối song song và bằng nhau.",
          "expr": "AB // CD, AD // BC, AB = CD, AD = BC"
        },
        {
          "category": "Góc",
          "description": "Bốn góc đều bằng nhau và bằng 90 độ.",
          "expr": "∠A = ∠B = ∠C = ∠D = 90°"
        },
        {
          "category": "Đường chéo",
          "description": "Hai đường chéo bằng nhau và cắt nhau tại trung điểm của mỗi đường.",
          "expr": "AC = BD, OA = OB = OC = OD"
        },
        {
          "category": "Đối xứng",
          "description": "Có một tâm đối xứng và hai trục đối xứng (hai đường trung trực của các cặp cạnh đối).",
          "expr": "1 tâm đối xứng, 2 trục đối xứng"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = (a + b) \\times 2",
          "expression": "(a + b) * 2",
          "params": [
            {
              "name": "a",
              "label": "Chiều dài (a)",
              "unit": "cm",
              "default": 8
            },
            {
              "name": "b",
              "label": "Chiều rộng (b)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = a \\times b",
          "expression": "a * b",
          "params": [
            {
              "name": "a",
              "label": "Chiều dài (a)",
              "unit": "cm",
              "default": 8
            },
            {
              "name": "b",
              "label": "Chiều rộng (b)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Tứ giác có ba góc vuông là hình chữ nhật.",
          "guide": "Chỉ ra trong tứ giác có ít nhất ba góc bằng 90 độ."
        },
        {
          "order": 2,
          "condition": "Hình thang cân có một góc vuông là hình chữ nhật.",
          "guide": "Chứng minh là hình thang cân, sau đó chỉ ra có một góc vuông."
        },
        {
          "order": 3,
          "condition": "Hình bình hành có một góc vuông là hình chữ nhật.",
          "guide": "Chứng minh tứ giác là hình bình hành trước, sau đó chỉ ra một góc bằng 90 độ."
        },
        {
          "order": 4,
          "condition": "Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật.",
          "guide": "Chứng minh tứ giác là hình bình hành, rồi so sánh độ dài hai đường chéo thấy bằng nhau."
        }
      ],
      "tips": [
        {
          "type": "Thơ ghi nhớ",
          "title": "Bài thơ diện tích hình chữ nhật",
          "content": "Diện tích hình chữ nhật đây\nChiều dài nhân rộng ra ngay kết bài\nChu vi muốn tính chẳng sai\nDài đem cộng rộng nhân hai rõ ràng."
        },
        {
          "type": "Cảnh giác bẫy",
          "title": "Bẫy đơn vị đo",
          "content": "Học sinh rất hay nhầm khi chiều dài tính bằng mét (m) nhưng chiều rộng lại cho bằng xăng-ti-mét (cm). Nhớ luôn đổi về cùng một đơn vị đo trước khi nhân."
        }
      ],
      "parents": [
        "SHAPE_PARALLELOGRAM"
      ],
      "svg_type": "rectangle"
    },
    {
      "id": "SHAPE_RHOMBUS",
      "name": "Hình thoi",
      "name_en": "Rhombus",
      "category": "CAT_QUAD",
      "definition": "Hình thoi là tứ giác có bốn cạnh bằng nhau.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 4, trang 72",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#d97706",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Bốn cạnh có độ dài bằng nhau, các cặp cạnh đối song song.",
          "expr": "AB = BC = CD = DA, AB // CD"
        },
        {
          "category": "Góc",
          "description": "Các góc đối bằng nhau, hai góc kề một cạnh bù nhau (tổng bằng 180 độ).",
          "expr": "∠A = ∠C, ∠B = ∠D"
        },
        {
          "category": "Đường chéo",
          "description": "Hai đường chéo vuông góc với nhau tại trung điểm của mỗi đường và là các đường phân giác của các góc.",
          "expr": "AC ⊥ BD tại O, AC là phân giác ∠A"
        },
        {
          "category": "Đối xứng",
          "description": "Có một tâm đối xứng (giao điểm hai đường chéo) và hai trục đối xứng (chính là hai đường chéo).",
          "expr": "1 tâm đối xứng, 2 trục đối xứng"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = 4a",
          "expression": "4 * a",
          "params": [
            {
              "name": "a",
              "label": "Độ dài cạnh (a)",
              "unit": "cm",
              "default": 6
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = \\frac{1}{2} d_1 d_2",
          "expression": "0.5 * d1 * d2",
          "params": [
            {
              "name": "d1",
              "label": "Độ dài đường chéo 1 (d1)",
              "unit": "cm",
              "default": 8
            },
            {
              "name": "d2",
              "label": "Độ dài đường chéo 2 (d2)",
              "unit": "cm",
              "default": 6
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Tứ giác có bốn cạnh bằng nhau là hình thoi.",
          "guide": "Chứng minh trực tiếp bốn cạnh của tứ giác có độ dài bằng nhau."
        },
        {
          "order": 2,
          "condition": "Hình bình hành có hai cạnh kề bằng nhau là hình thoi.",
          "guide": "Chứng minh tứ giác là hình bình hành, sau đó chỉ ra hai cạnh kề có độ dài bằng nhau."
        },
        {
          "order": 3,
          "condition": "Hình bình hành có hai đường chéo vuông góc với nhau là hình thoi.",
          "guide": "Chứng minh là hình bình hành, sau đó chứng minh AC vuông góc BD."
        },
        {
          "order": 4,
          "condition": "Hình bình hành có một đường chéo là đường phân giác của một góc là hình thoi.",
          "guide": "Chứng minh là hình bình hành, sau đó chỉ ra đường chéo chia đôi góc ở đỉnh."
        }
      ],
      "tips": [
        {
          "type": "Thơ ghi nhớ",
          "title": "Bài thơ diện tích hình thoi",
          "content": "Hình thoi diện tích tính sao\nHai đường chéo ấy nhân vào chia đôi\nChu vi thì dễ quá rồi\nMột cạnh nhân bốn thảnh thơi tính liền."
        },
        {
          "type": "Cảnh giác bẫy",
          "title": "Nhầm công thức diện tích",
          "content": "Nhiều bạn nhầm diện tích hình thoi bằng tích hai đường chéo mà quên chia cho hai. Hãy nhớ luôn có hệ số 1/2."
        }
      ],
      "parents": [
        "SHAPE_PARALLELOGRAM"
      ],
      "svg_type": "rhombus"
    },
    {
      "id": "SHAPE_PARALLELOGRAM",
      "name": "Hình bình hành",
      "name_en": "Parallelogram",
      "category": "CAT_QUAD",
      "definition": "Hình bình hành là tứ giác có các cặp cạnh đối song song.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 3, trang 66",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#059669",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Các cặp cạnh đối song song và có độ dài bằng nhau.",
          "expr": "AB // CD, AD // BC, AB = CD, AD = BC"
        },
        {
          "category": "Góc",
          "description": "Các góc đối bằng nhau, hai góc kề một cạnh có tổng bằng 180 độ.",
          "expr": "∠A = ∠C, ∠B = ∠D, ∠A + ∠B = 180°"
        },
        {
          "category": "Đường chéo",
          "description": "Hai đường chéo cắt nhau tại trung điểm của mỗi đường.",
          "expr": "OA = OC, OB = OD"
        },
        {
          "category": "Đối xứng",
          "description": "Có một tâm đối xứng là giao điểm của hai đường chéo (không có trục đối xứng nói chung).",
          "expr": "1 tâm đối xứng"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = (a + b) \\times 2",
          "expression": "(a + b) * 2",
          "params": [
            {
              "name": "a",
              "label": "Độ dài cạnh đáy (a)",
              "unit": "cm",
              "default": 7
            },
            {
              "name": "b",
              "label": "Độ dài cạnh bên (b)",
              "unit": "cm",
              "default": 4
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = a \\times h",
          "expression": "a * h",
          "params": [
            {
              "name": "a",
              "label": "Độ dài cạnh đáy (a)",
              "unit": "cm",
              "default": 7
            },
            {
              "name": "h",
              "label": "Chiều cao tương ứng (h)",
              "unit": "cm",
              "default": 4
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Tứ giác có các cặp cạnh đối song song là hình bình hành.",
          "guide": "Chứng minh AB // CD và AD // BC."
        },
        {
          "order": 2,
          "condition": "Tứ giác có các cặp cạnh đối bằng nhau là hình bình hành.",
          "guide": "Chứng minh AB = CD và AD = BC."
        },
        {
          "order": 3,
          "condition": "Tứ giác có một cặp cạnh đối vừa song song vừa bằng nhau là hình bình hành.",
          "guide": "Chỉ cần chứng minh AB // CD và AB = CD."
        },
        {
          "order": 4,
          "condition": "Tứ giác có hai đường chéo cắt nhau tại trung điểm của mỗi đường là hình bình hành.",
          "guide": "Chứng minh O là trung điểm chung của cả AC và BD."
        }
      ],
      "tips": [
        {
          "type": "Thơ ghi nhớ",
          "title": "Bài thơ diện tích hình bình hành",
          "content": "Hình bình hành cũng dễ ghê\nCạnh đáy nhân với chiều cao tức thì\nĐơn vị đo hãy nhớ ghi\nVuông vức diện tích phẳng lì điểm cao."
        },
        {
          "type": "Cảnh giác bẫy",
          "title": "Nhầm chiều cao với cạnh bên",
          "content": "Nhiều bài toán cho cạnh đáy và cạnh bên, học sinh thường lấy đáy nhân luôn với cạnh bên là sai. Bắt buộc phải nhân với đường cao vuông góc hạ từ đỉnh xuống đáy."
        }
      ],
      "parents": [
        "SHAPE_TRAPEZOID"
      ],
      "svg_type": "parallelogram"
    },
    {
      "id": "SHAPE_TRAPEZOID",
      "name": "Hình thang",
      "name_en": "Trapezoid",
      "category": "CAT_QUAD",
      "definition": "Hình thang là tứ giác có hai cạnh đối song song.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 2, trang 61",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#84cc16",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Có hai cạnh đối song song gọi là hai đáy, hai cạnh còn lại gọi là hai cạnh bên.",
          "expr": "AB // CD (đáy lớn, đáy nhỏ)"
        },
        {
          "category": "Góc",
          "description": "Hai góc kề một cạnh bên có tổng số đo bằng 180 độ (hai góc trong cùng phía bù nhau).",
          "expr": "∠A + ∠D = 180°, ∠B + ∠C = 180°"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = a + b + c + d",
          "expression": "a + b + c + d",
          "params": [
            {
              "name": "a",
              "label": "Đáy lớn (a)",
              "unit": "cm",
              "default": 10
            },
            {
              "name": "b",
              "label": "Đáy nhỏ (b)",
              "unit": "cm",
              "default": 6
            },
            {
              "name": "c",
              "label": "Cạnh bên thứ nhất (c)",
              "unit": "cm",
              "default": 4
            },
            {
              "name": "d",
              "label": "Cạnh bên thứ hai (d)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = \\frac{(a + b) \\times h}{2}",
          "expression": "(a + b) * h / 2",
          "params": [
            {
              "name": "a",
              "label": "Đáy lớn (a)",
              "unit": "cm",
              "default": 10
            },
            {
              "name": "b",
              "label": "Đáy nhỏ (b)",
              "unit": "cm",
              "default": 6
            },
            {
              "name": "h",
              "label": "Chiều cao (h)",
              "unit": "cm",
              "default": 4
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Tứ giác có hai cạnh đối song song là hình thang.",
          "guide": "Chỉ ra trong tứ giác có một cặp cạnh song song với nhau."
        }
      ],
      "tips": [
        {
          "type": "Thơ ghi nhớ",
          "title": "Bài thơ diện tích hình thang",
          "content": "Muốn tính diện tích hình thang\nĐáy lớn đáy nhỏ ta mang cộng vào\nThế rồi nhân với chiều cao\nChia đôi lấy nửa thế nào cũng ra."
        },
        {
          "type": "Cảnh giác bẫy",
          "title": "Quên chia đôi",
          "content": "Lỗi kinh điển của học sinh là lấy tổng hai đáy nhân chiều cao rồi quên chia 2."
        }
      ],
      "parents": [
        "SHAPE_CONVEX_QUAD"
      ],
      "svg_type": "trapezoid"
    },
    {
      "id": "SHAPE_ISOSCELES_TRAPEZOID",
      "name": "Hình thang cân",
      "name_en": "Isosceles trapezoid",
      "category": "CAT_QUAD",
      "definition": "Hình thang cân là hình thang có hai góc kề một đáy bằng nhau.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 2, trang 63",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#0d9488",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Hai cạnh bên có độ dài bằng nhau.",
          "expr": "AD = BC"
        },
        {
          "category": "Góc",
          "description": "Hai góc kề một đáy bằng nhau.",
          "expr": "∠C = ∠D, ∠A = ∠B"
        },
        {
          "category": "Đường chéo",
          "description": "Hai đường chéo có độ dài bằng nhau.",
          "expr": "AC = BD"
        },
        {
          "category": "Đối xứng",
          "description": "Có một trục đối xứng là đường trung trực của hai đáy.",
          "expr": "1 trục đối xứng"
        },
        {
          "category": "Đường tròn",
          "description": "Hình thang cân luôn có đường tròn ngoại tiếp đi qua bốn đỉnh.",
          "expr": "Ngoại tiếp được đường tròn"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = a + b + 2c",
          "expression": "a + b + 2 * c",
          "params": [
            {
              "name": "a",
              "label": "Đáy lớn (a)",
              "unit": "cm",
              "default": 12
            },
            {
              "name": "b",
              "label": "Đáy nhỏ (b)",
              "unit": "cm",
              "default": 6
            },
            {
              "name": "c",
              "label": "Cạnh bên (c)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = \\frac{(a + b) \\times h}{2}",
          "expression": "(a + b) * h / 2",
          "params": [
            {
              "name": "a",
              "label": "Đáy lớn (a)",
              "unit": "cm",
              "default": 12
            },
            {
              "name": "b",
              "label": "Đáy nhỏ (b)",
              "unit": "cm",
              "default": 6
            },
            {
              "name": "h",
              "label": "Chiều cao (h)",
              "unit": "cm",
              "default": 4
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Hình thang có hai góc kề một đáy bằng nhau là hình thang cân.",
          "guide": "Chứng minh tứ giác là hình thang trước, sau đó chỉ ra hai góc kề đáy bằng nhau."
        },
        {
          "order": 2,
          "condition": "Hình thang có hai đường chéo bằng nhau là hình thang cân.",
          "guide": "Chứng minh tứ giác là hình thang, rồi chỉ ra độ dài AC = BD."
        }
      ],
      "tips": [
        {
          "type": "Thơ ghi nhớ",
          "title": "Bài thơ hình thang cân",
          "content": "Hình thang cân có lạ gì\nHai góc một đáy tức thì bằng nhau\nCạnh bên đường chéo cùng màu\nĐều bằng nhau cả, trước sau vẹn toàn."
        },
        {
          "type": "Cảnh giác bẫy",
          "title": "Bẫy nhận biết hình thang cân",
          "content": "CHÚ Ý BẪY: Hình thang có hai cạnh bên bằng nhau CHƯA CHẮC là hình thang cân, vì đó có thể là hình bình hành. Bắt buộc phải là hai góc kề một đáy bằng nhau hoặc hai đường chéo bằng nhau mới là hình thang cân."
        }
      ],
      "parents": [
        "SHAPE_TRAPEZOID"
      ],
      "svg_type": "isosceles_trapezoid"
    },
    {
      "id": "SHAPE_RIGHT_TRAPEZOID",
      "name": "Hình thang vuông",
      "name_en": "Right trapezoid",
      "category": "CAT_QUAD",
      "definition": "Hình thang vuông là hình thang có một góc vuông.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 2, trang 62",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#64748b",
      "properties": [
        {
          "category": "Cạnh",
          "description": "Cạnh bên vuông góc với hai đáy chính là đường cao của hình thang.",
          "expr": "h = AD ⊥ AB, AD ⊥ CD"
        },
        {
          "category": "Góc",
          "description": "Có hai góc vuông kề với cạnh bên vuông góc.",
          "expr": "∠A = ∠D = 90°"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = a + b + h + c",
          "expression": "a + b + h + c",
          "params": [
            {
              "name": "a",
              "label": "Đáy lớn (a)",
              "unit": "cm",
              "default": 9
            },
            {
              "name": "b",
              "label": "Đáy nhỏ (b)",
              "unit": "cm",
              "default": 5
            },
            {
              "name": "h",
              "label": "Cạnh bên vuông góc / Chiều cao (h)",
              "unit": "cm",
              "default": 4
            },
            {
              "name": "c",
              "label": "Cạnh bên nghiêng (c)",
              "unit": "cm",
              "default": 5
            }
          ],
          "unit": "cm"
        },
        {
          "type": "Diện tích",
          "latex": "S = \\frac{(a + b) \\times h}{2}",
          "expression": "(a + b) * h / 2",
          "params": [
            {
              "name": "a",
              "label": "Đáy lớn (a)",
              "unit": "cm",
              "default": 9
            },
            {
              "name": "b",
              "label": "Đáy nhỏ (b)",
              "unit": "cm",
              "default": 5
            },
            {
              "name": "h",
              "label": "Chiều cao (h)",
              "unit": "cm",
              "default": 4
            }
          ],
          "unit": "cm²"
        }
      ],
      "identifications": [
        {
          "order": 1,
          "condition": "Hình thang có một góc vuông là hình thang vuông.",
          "guide": "Chứng minh tứ giác có hai cạnh đối song song và có một góc trong bằng 90 độ."
        }
      ],
      "tips": [
        {
          "type": "Mẹo giải nhanh",
          "title": "Tính cạnh bên nghiêng",
          "content": "Kẻ đường cao từ đỉnh đáy nhỏ xuống đáy lớn để tạo thành một tam giác vuông, sau đó dùng định lý Pythagoras để tìm cạnh bên nghiêng rất nhanh."
        }
      ],
      "parents": [
        "SHAPE_TRAPEZOID"
      ],
      "svg_type": "right_trapezoid"
    },
    {
      "id": "SHAPE_CONVEX_QUAD",
      "name": "Tứ giác",
      "name_en": "Quadrilateral",
      "category": "CAT_QUAD",
      "definition": "Tứ giác là hình gồm bốn đoạn thẳng, trong đó bất kì hai đoạn thẳng nào cũng không cùng nằm trên một đường thẳng.",
      "sides_count": 4,
      "vertices_count": 4,
      "sum_interior_angles": 360,
      "is_regular": false,
      "source_id": "SGK Toán 8 - Kết nối tri thức",
      "source_locator": "Chương 3, bài 1, trang 58",
      "status": "APPROVED",
      "verified_by": "GV. Trần Quý Ban",
      "color": "#64748b",
      "properties": [
        {
          "category": "Góc",
          "description": "Tổng các góc trong của một tứ giác lồi luôn bằng 360 độ.",
          "expr": "∠A + ∠B + ∠C + ∠D = 360°"
        },
        {
          "category": "Đường chéo",
          "description": "Có hai đường chéo nối các cặp đỉnh đối diện.",
          "expr": "AC cắt BD"
        }
      ],
      "formulas": [
        {
          "type": "Chu vi",
          "latex": "P = a + b + c + d",
          "eval": "a + b + c + d",
          "unit": "cm",
          "params": [
            {
              "key": "a",
              "label": "Cạnh 1 (a)",
              "default": 4
            },
            {
              "key": "b",
              "label": "Cạnh 2 (b)",
              "default": 5
            },
            {
              "key": "c",
              "label": "Cạnh 3 (c)",
              "default": 6
            },
            {
              "key": "d",
              "label": "Cạnh 4 (d)",
              "default": 7
            }
          ]
        }
      ],
      "identifications": [
        "Đa giác có bốn đỉnh và bốn cạnh khép kín."
      ],
      "tips": [
        {
          "type": "Mẹo nhớ",
          "title": "Tổng các góc tứ giác",
          "content": "Cắt đôi tứ giác bằng đường chéo được hai tam giác, tổng góc bằng 180° × 2 = 360°."
        }
      ],
      "parents": [],
      "svg_type": "quadrilateral"
    },
  ],
  "transitions": [
    {
      "from": "SHAPE_CONVEX_QUAD",
      "to": "SHAPE_TRAPEZOID",
      "condition": "Có hai cạnh đối song song"
    },
    {
      "from": "SHAPE_TRAPEZOID",
      "to": "SHAPE_ISOSCELES_TRAPEZOID",
      "condition": "Có hai góc kề một đáy bằng nhau hoặc hai đường chéo bằng nhau"
    },
    {
      "from": "SHAPE_TRAPEZOID",
      "to": "SHAPE_RIGHT_TRAPEZOID",
      "condition": "Có một góc vuông"
    },
    {
      "from": "SHAPE_TRAPEZOID",
      "to": "SHAPE_PARALLELOGRAM",
      "condition": "Có hai cạnh bên song song"
    },
    {
      "from": "SHAPE_ISOSCELES_TRAPEZOID",
      "to": "SHAPE_RECTANGLE",
      "condition": "Có một góc vuông"
    },
    {
      "from": "SHAPE_RIGHT_TRAPEZOID",
      "to": "SHAPE_RECTANGLE",
      "condition": "Có thêm góc vuông thứ hai ở đáy đối diện"
    },
    {
      "from": "SHAPE_PARALLELOGRAM",
      "to": "SHAPE_RECTANGLE",
      "condition": "Có một góc vuông hoặc hai đường chéo bằng nhau"
    },
    {
      "from": "SHAPE_PARALLELOGRAM",
      "to": "SHAPE_RHOMBUS",
      "condition": "Có hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc"
    },
    {
      "from": "SHAPE_RECTANGLE",
      "to": "SHAPE_SQUARE",
      "condition": "Có hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc"
    },
    {
      "from": "SHAPE_RHOMBUS",
      "to": "SHAPE_SQUARE",
      "condition": "Có một góc vuông hoặc hai đường chéo bằng nhau"
    }
  ],
  "quizzes": [
    {
      "id": "Q01",
      "shape_id": "SHAPE_RHOMBUS",
      "question": "Hình bình hành có hai đường chéo vuông góc với nhau là hình gì?",
      "options": [
        "Hình chữ nhật",
        "Hình thoi",
        "Hình thang cân",
        "Hình vuông"
      ],
      "answer": 1,
      "explanation": "Theo dấu hiệu nhận biết SGK Toán 8, hình bình hành có hai đường chéo vuông góc là hình thoi.",
      "hints": [
        "Gợi ý 1: Hãy chú ý đến tính chất vuông góc của hai đường chéo.",
        "Gợi ý 2: Hai đường chéo vuông góc là đặc trưng nhận biết từ hình bình hành lên hình thoi.",
        "Gợi ý 3: Đáp án chính xác là Hình thoi."
      ]
    },
    {
      "id": "Q02",
      "shape_id": "SHAPE_ISOSCELES_TRAPEZOID",
      "question": "Tính chất nào sau đây KHÔNG PHẢI là tính chất của hình thang cân?",
      "options": [
        "Hai cạnh bên bằng nhau",
        "Hai đường chéo bằng nhau",
        "Hai đường chéo vuông góc với nhau",
        "Hai góc kề một đáy bằng nhau"
      ],
      "answer": 2,
      "explanation": "Hình thang cân chỉ có hai đường chéo bằng nhau chứ không nhất thiết phải vuông góc với nhau.",
      "hints": [
        "Gợi ý 1: Hãy xem lại tính chất đường chéo của hình thang cân.",
        "Gợi ý 2: Đường chéo hình thang cân chỉ bằng nhau, tính chất vuông góc chỉ có ở hình vuông hoặc hình thoi.",
        "Gợi ý 3: Tính chất sai là: Hai đường chéo vuông góc với nhau."
      ]
    },
    {
      "id": "Q03",
      "shape_id": "SHAPE_SQUARE",
      "question": "Hình chữ nhật cần thêm điều kiện gì để trở thành hình vuông?",
      "options": [
        "Có hai đường chéo bằng nhau",
        "Có hai cạnh kề bằng nhau",
        "Có bốn góc vuông",
        "Có các cạnh đối song song"
      ],
      "answer": 1,
      "explanation": "Hình chữ nhật vốn đã có 4 góc vuông và 2 đường chéo bằng nhau. Cần thêm hai cạnh kề bằng nhau (hoặc hai đường chéo vuông góc) để trở thành hình vuông.",
      "hints": [
        "Gợi ý 1: Hình chữ nhật vốn đã có 4 góc vuông và 2 đường chéo bằng nhau rồi.",
        "Gợi ý 2: Cần thêm tính chất về cạnh bằng nhau của hình thoi.",
        "Gợi ý 3: Chọn: Có hai cạnh kề bằng nhau."
      ]
    },
    {
      "id": "Q04",
      "shape_id": "SHAPE_PARALLELOGRAM",
      "question": "Tứ giác có các cạnh đối song song từng đôi một là hình gì?",
      "options": [
        "Hình thang vuông",
        "Hình bình hành",
        "Hình thoi",
        "Hình chữ nhật"
      ],
      "answer": 1,
      "explanation": "Theo định nghĩa SGK Toán 8, tứ giác có các cạnh đối song song là hình bình hành.",
      "hints": [
        "Gợi ý 1: Chú ý định nghĩa về hai cặp cạnh đối song song.",
        "Gợi ý 2: Đây là định nghĩa mở đầu của Bài 3 - Chương 3 SGK Toán 8.",
        "Gợi ý 3: Đáp án chính xác là Hình bình hành."
      ]
    },
    {
      "id": "Q05",
      "shape_id": "SHAPE_CONVEX_QUAD",
      "question": "Tổng số đo bốn góc trong của một tứ giác lồi luôn bằng bao nhiêu độ?",
      "options": [
        "180°",
        "270°",
        "360°",
        "540°"
      ],
      "answer": 2,
      "explanation": "Theo định lý tổng các góc trong của tứ giác lồi: ∠A + ∠B + ∠C + ∠D = 360°.",
      "hints": [
        "Gợi ý 1: Một đường chéo chia tứ giác thành 2 tam giác.",
        "Gợi ý 2: Mỗi tam giác có tổng các góc bằng 180°.",
        "Gợi ý 3: 180° × 2 = 360°."
      ]
    },
    {
      "id": "Q06",
      "shape_id": "SHAPE_RIGHT_TRAPEZOID",
      "question": "Hình thang có một góc vuông được gọi là hình gì?",
      "options": [
        "Hình thang cân",
        "Hình thang vuông",
        "Hình chữ nhật",
        "Hình bình hành"
      ],
      "answer": 1,
      "explanation": "Định nghĩa SGK: Hình thang có một góc vuông là hình thang vuông.",
      "hints": [
        "Gợi ý 1: Tên gọi phản ánh đúng đặc điểm góc vuông của hình thang.",
        "Gợi ý 2: Đây là trường hợp đặc biệt thứ nhất của hình thang.",
        "Gợi ý 3: Chọn: Hình thang vuông."
      ]
    },
    {
      "id": "Q07",
      "shape_id": "SHAPE_RHOMBUS",
      "question": "Một hình thoi có độ dài hai đường chéo lần lượt là 6 cm và 10 cm. Diện tích của hình thoi đó là:",
      "options": [
        "60 cm²",
        "30 cm²",
        "16 cm²",
        "32 cm²"
      ],
      "answer": 1,
      "explanation": "Công thức diện tích hình thoi S = (d₁ × d₂) / 2 = (6 × 10) / 2 = 30 cm².",
      "hints": [
        "Gợi ý 1: Công thức diện tích hình thoi là nửa tích hai đường chéo.",
        "Gợi ý 2: S = (6 × 10) / 2.",
        "Gợi ý 3: Đáp án là 30 cm²."
      ]
    },
    {
      "id": "Q08",
      "shape_id": "SHAPE_RECTANGLE",
      "question": "Hình chữ nhật có chiều dài 8 cm và chiều rộng 5 cm. Diện tích của hình chữ nhật đó là:",
      "options": [
        "26 cm²",
        "13 cm²",
        "40 cm²",
        "20 cm²"
      ],
      "answer": 2,
      "explanation": "Diện tích hình chữ nhật S = dài × rộng = 8 × 5 = 40 cm².",
      "hints": [
        "Gợi ý 1: Diện tích hình chữ nhật bằng chiều dài nhân chiều rộng.",
        "Gợi ý 2: S = 8 × 5.",
        "Gợi ý 3: Đáp án là 40 cm²."
      ]
    },
    {
      "id": "Q09",
      "shape_id": "SHAPE_SQUARE",
      "question": "Hình thoi có thêm điều kiện nào sau đây thì trở thành hình vuông?",
      "options": [
        "Có hai đường chéo vuông góc",
        "Có bốn cạnh bằng nhau",
        "Có một góc vuông",
        "Có hai cặp cạnh đối song song"
      ],
      "answer": 2,
      "explanation": "Hình thoi đã có 4 cạnh bằng nhau và 2 đường chéo vuông góc. Thêm 1 góc vuông (hoặc 2 đường chéo bằng nhau) sẽ biến hình thoi thành hình vuông.",
      "hints": [
        "Gợi ý 1: Hình thoi đã có sẵn 4 cạnh bằng nhau và 2 đường chéo vuông góc.",
        "Gợi ý 2: Cần thêm tính chất góc vuông của hình chữ nhật.",
        "Gợi ý 3: Chọn: Có một góc vuông."
      ]
    },
    {
      "id": "Q10",
      "shape_id": "SHAPE_CONVEX_QUAD",
      "question": "Cho tứ giác ABCD có ∠A = 75°, ∠B = 105°, ∠C = 90°. Số đo của góc ∠D là:",
      "options": [
        "80°",
        "90°",
        "100°",
        "110°"
      ],
      "answer": 1,
      "explanation": "Tổng 4 góc tứ giác bằng 360° ⇒ ∠D = 360° - (75° + 105° + 90°) = 360° - 270° = 90°.",
      "hints": [
        "Gợi ý 1: Sử dụng định lý tổng 4 góc trong tứ giác bằng 360°.",
        "Gợi ý 2: Lấy 360° trừ đi tổng (75° + 105° + 90°).",
        "Gợi ý 3: 360° - 270° = 90°."
      ]
    },
    {
      "id": "Q11",
      "shape_id": "SHAPE_PARALLELOGRAM",
      "question": "Trong các tính chất sau, tính chất nào là của hình bình hành?",
      "options": [
        "Hai đường chéo vuông góc với nhau",
        "Hai đường chéo bằng nhau",
        "Hai đường chéo cắt nhau tại trung điểm của mỗi đường",
        "Có bốn góc vuông"
      ],
      "answer": 2,
      "explanation": "Tính chất đặc trưng của hình bình hành là hai đường chéo cắt nhau tại trung điểm của mỗi đường.",
      "hints": [
        "Gợi ý 1: Xem xét tính chất giao điểm hai đường chéo.",
        "Gợi ý 2: Giao điểm hai đường chéo là tâm đối xứng của hình bình hành.",
        "Gợi ý 3: Chọn: Hai đường chéo cắt nhau tại trung điểm của mỗi đường."
      ]
    },
    {
      "id": "Q12",
      "shape_id": "SHAPE_ISOSCELES_TRAPEZOID",
      "question": "Khẳng định nào sau đây là DẤU HIỆU NHẬN BIẾT hình thang cân?",
      "options": [
        "Hình thang có hai cạnh bên bằng nhau",
        "Hình thang có hai đường chéo bằng nhau",
        "Hình thang có hai góc đối bằng nhau",
        "Hình thang có hai đường chéo vuông góc"
      ],
      "answer": 1,
      "explanation": "Dấu hiệu nhận biết hình thang cân: Hình thang có hai góc kề một đáy bằng nhau HOẶC có hai đường chéo bằng nhau.",
      "hints": [
        "Gợi ý 1: Cẩn thận bẫy 'hai cạnh bên bằng nhau' chưa chắc là hình thang cân.",
        "Gợi ý 2: Hai đường chéo bằng nhau là dấu hiệu nhận biết chuẩn SGK.",
        "Gợi ý 3: Đáp án: Hình thang có hai đường chéo bằng nhau."
      ]
    },
    {
      "id": "Q13",
      "shape_id": "SHAPE_RECTANGLE",
      "question": "Hình bình hành ABCD có AC = BD. Tứ giác ABCD là hình gì?",
      "options": [
        "Hình thoi",
        "Hình chữ nhật",
        "Hình vuông",
        "Hình thang cân"
      ],
      "answer": 1,
      "explanation": "Dấu hiệu nhận biết: Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật.",
      "hints": [
        "Gợi ý 1: AC và BD là hai đường chéo của hình bình hành.",
        "Gợi ý 2: Hai đường chéo bằng nhau biến hình bình hành thành hình chữ nhật.",
        "Gợi ý 3: Chọn: Hình chữ nhật."
      ]
    },
    {
      "id": "Q14",
      "shape_id": "SHAPE_SQUARE",
      "question": "Một khu vườn hình vuông có chu vi là 36 m. Diện tích của khu vườn đó là:",
      "options": [
        "36 m²",
        "81 m²",
        "72 m²",
        "144 m²"
      ],
      "answer": 1,
      "explanation": "Độ dài cạnh hình vuông a = 36 / 4 = 9 m. Diện tích S = a² = 9 × 9 = 81 m².",
      "hints": [
        "Gợi ý 1: Tìm độ dài 1 cạnh a = Chu vi / 4.",
        "Gợi ý 2: a = 36 / 4 = 9 m.",
        "Gợi ý 3: S = 9 × 9 = 81 m²."
      ]
    },
    {
      "id": "Q15",
      "shape_id": "SHAPE_TRAPEZOID",
      "question": "Tứ giác ABCD có AB // CD. Tứ giác ABCD là hình gì?",
      "options": [
        "Hình bình hành",
        "Hình thang",
        "Hình chữ nhật",
        "Hình thoi"
      ],
      "answer": 1,
      "explanation": "Định nghĩa: Tứ giác có hai cạnh đối song song là hình thang.",
      "hints": [
        "Gợi ý 1: Tứ giác mới chỉ có 1 cặp cạnh đối song song (AB // CD).",
        "Gợi ý 2: Đây là định nghĩa cơ bản của hình thang.",
        "Gợi ý 3: Chọn: Hình thang."
      ]
    }
  ]
};
