# 📐 GeoGraph - Hệ Thống Hỗ Trợ Học Toán Hình Học Phẳng (Tứ Giác)

> **Dự án Ứng dụng Công nghệ Đồ thị Tri thức (Graph Database - Neo4j) & Mô phỏng Tương tác Động 2D trong Giảng dạy Hình học Phẳng SGK Toán 8**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![Neo4j](https://img.shields.io/badge/Neo4j-v5.0-blueviolet.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.0-06b6d4.svg)

---

## 🌟 Giới Thiệu Đề Tài

**GeoGraph** là ứng dụng web tương tác thông minh hỗ trợ học tập và giảng dạy môn **Hình học Phẳng (Chủ đề Tứ giác - SGK Toán 8)**. Hệ thống kết hợp giữa **Bàn vẽ tương tác động 2D** và **Sơ đồ tri thức Neo4j 50:50** để giúp học sinh trực quan hóa sự chuyển hóa giữa các loại tứ giác, tính toán số đo thời gian thực và luyện tập các bài tập đa dạng.

---

## ✨ Các Tính Năng Nổi Bật

1. 🎨 **Xưởng Hình Học Tương Tác Động 2D (Interactive Canvas)**
   - Kéo thả tự do 4 đỉnh $A, B, C, D$ với thuật toán nam châm hít ô lưới ($20\text{px} = 1\text{cm}$).
   - Tự động nhận diện định lý hình học tức thời (Hình vuông, Hình chữ nhật, Hình thoi, Hình bình hành, Hình thang cân, Hình thang vuông).
   - Cảnh báo vi phạm hình học (Tứ giác tự cắt cánh bướm, Tứ giác lõm) kèm nút **`⚡ Gỡ rối hình`** tự động nắn lồi.

2. 🧠 **Sơ Đồ Tri Thức Chuyển Hóa Hình Học (Neo4j Graph Engine)**
   - Trực quan hóa cây phả hệ các hình học dưới dạng đồ thị (Nodes & Edges).
   - Tự động hiển thị điều kiện chuyển tiếp khi click/rê chuột vào đường nối.
   - Giao diện song song 50:50 giữa Sơ đồ Đồ thị và Mô phỏng 2D sinh động.

3. 📚 **Ngân Hàng Bài Tập Minh Họa Đa Dạng (3 Dạng Bài Tập)**
   - **Dạng 1: Chứng minh** - 10 bài toán chứng minh định lý chuẩn SGK Toán 8 cho từng loại hình.
   - **Dạng 2: Tính toán** - 10 bài toán tính Chu vi, Diện tích, Đường chéo, Đường trung bình tự động đồng bộ theo số đo sống.
   - **Dạng 3: Thực tế** - 10 kịch bản ứng dụng đời sống phong phú (Bánh chưng Tết, Sân bóng đá, Diều giấy, Mái nhà Thái, v.v.).

4. 📖 **Thư Viện Hồ Sơ Kiến Thức 5 Tab Modal**
   - **Tab 1: Đặc điểm hình học** - Vector preview 2D, thẻ phân loại Cạnh - Góc - Đường chéo - Đối xứng.
   - **Tab 2: Máy tính công thức** - Thẻ công thức LaTeX rực rỡ, slider tương tác, xuất lời giải từng bước.
   - **Tab 3: Chuyển tiếp & chứng minh** - Tiến trình tiến hóa hình học (Hình tiền thân & Hình bậc cao).
   - **Tab 4: Mẹo nhớ & Thảo luận cộng đồng** - Bài thơ thần đồng, mẹo né bẫy thi và **Khung đăng bài thảo luận ghi nhớ tự động**.
   - **Tab 5: Nguồn thẩm định SGK** - Chứng nhận đã kiểm định chuẩn GDPT 2018.

5. 🤖 **Trợ Lý AI Hỏi Đáp Hình Học Thông Minh**
   - Giải đáp thắc mắc lý thuyết và bài tập hình học 24/7.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: HTML5, TailwindCSS, JavaScript (ES6+), Vis.js Network, SVG 2D Engine, KaTeX / MathML.
- **Backend**: Node.js, Express.js REST API.
- **Database**: CSDL Đồ thị Neo4j (Graph Database) / In-Memory Graph Engine fallback.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Yêu cầu hệ thống
- Node.js version 18.0 trở lên.
- (Tùy chọn) CSDL Neo4j Desktop hoặc Neo4j AuraDB Cloud.

### 2. Các bước khởi chạy

```bash
# Clone repository từ GitHub
git clone https://github.com/Vanngoccc/GeoGraph.git

# Di chuyển vào thư mục dự án
cd GeoGraph

# Cài đặt thư viện backend
cd backend
npm install

# Khởi chạy server
node server.js
```

Truy cập ứng dụng tại trình duyệt: **`http://localhost:5050`**

---

## 🌐 Hướng Dẫn Deploy Lên Web Miễn Phí (Render.com)

Để học sinh và giáo viên truy cập **mọi lúc mọi nơi** trên mọi thiết bị:

1. Đăng ký tài khoản miễn phí tại [Render.com](https://render.com).
2. Tạo **New Web Service** $\rightarrow$ Kết nối với repository GitHub `Vanngoccc/GeoGraph`.
3. Cấu hình thông số:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Nhấn **Create Web Service**. Ứng dụng sẽ hoạt động tại đường dẫn: `https://geograph.onrender.com`.

---

## 📜 Giấy Phép (License)

Dự án phát triển dưới giấy phép MIT License. Bản quyền thuộc về Huỳnh Văn Ngọc.
