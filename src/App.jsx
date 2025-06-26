// File App.jsx - Phiên bản gỡ lỗi
import './App.css';

function App() {
  // Lấy giá trị biến môi trường mà Vercel cung cấp cho ứng dụng
  const supbaseUrlFromEnv = import.meta.env.VITE_SUPABASE_URL;
  const anonKeyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Giao diện này chỉ dùng để hiển thị các giá trị đó ra màn hình
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', fontSize: '16px', lineHeight: '1.8' }}>
      <h1>Trang Kiểm Tra Biến Môi Trường</h1>
      <p>Đây là thông tin mà ứng dụng của bạn đang "nhìn thấy" được trên máy chủ Vercel.</p>
      <p>Hãy chụp lại toàn bộ màn hình này và gửi lại cho tôi.</p>
      <hr style={{ margin: '20px 0' }} />

      <div>
        <h3>VITE_SUPABASE_URL:</h3>
        <p style={{ 
            color: supbaseUrlFromEnv ? 'green' : 'red', 
            fontWeight: 'bold', 
            wordWrap: 'break-word' 
          }}>
          {/* Nếu có giá trị thì in ra, nếu không thì báo lỗi */}
          {supbaseUrlFromEnv ? supbaseUrlFromEnv : '!!! BỊ TRỐNG HOẶC SAI TÊN BIẾN !!!'}
        </p>
      </div>

      <hr style={{ margin: '20px 0' }} />

      <div>
        <h3>VITE_SUPABASE_ANON_KEY:</h3>
        <p style={{ 
            color: anonKeyFromEnv ? 'green' : 'red', 
            fontWeight: 'bold',
            wordWrap: 'break-word' 
          }}>
          {/* Nếu có giá trị thì in ra 20 ký tự đầu, nếu không thì báo lỗi */}
          {anonKeyFromEnv ? `${anonKeyFromEnv.substring(0, 20)}... (và các ký tự còn lại)` : '!!! BỊ TRỐNG HOẶC SAI TÊN BIẾN !!!'}
        </p>
        <p>(Chỉ hiển thị một phần key để bảo mật)</p>
      </div>
      
      <hr style={{ margin: '20px 0' }} />
      <h3>Kết luận</h3>
      <p>Nếu bất kỳ dòng nào ở trên hiện màu **đỏ** và báo **'BỊ TRỐNG'**, đó chính là nguyên nhân của mọi vấn đề.</p>

    </div>
  );
}

export default App;