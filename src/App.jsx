import { useState } from 'react';
import './App.css';
import CustomerList from './components/CustomerList';
import CustomerDetails from './components/CustomerDetails'; // Lấy linh kiện mới vào

function App() {
  // Biến này sẽ lưu ID của khách hàng đang được chọn
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  return (
    <div className="App">
      <header>
        <h1>Bảng Công Nợ Khách Hàng</h1>
      </header>
      <main>
        {/* === LOGIC HIỂN THỊ CÓ ĐIỀU KIỆN === */}
        {!selectedCustomerId ? (
          // NẾU không có khách hàng nào được chọn (selectedCustomerId là null),
          // THÌ hiển thị danh sách khách hàng (CustomerList).
          // Ta đưa cho nó hàm setSelectedCustomerId để nó có thể "báo" cho ta biết khi nào một khách hàng được chọn.
          <CustomerList onSelectCustomer={setSelectedCustomerId} />
        ) : (
          // NGƯỢC LẠI, NẾU có một khách hàng đã được chọn,
          // THÌ hiển thị trang chi tiết (CustomerDetails).
          // Ta đưa cho nó ID của khách hàng được chọn, và một hàm để nó có thể "báo" khi người dùng muốn quay lại.
          <CustomerDetails
            customerId={selectedCustomerId}
            onBack={() => setSelectedCustomerId(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;