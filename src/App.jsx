import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

function App() {
  // === TOÀN BỘ STATE NẰM Ở ĐÂY ===
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', notes: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState({ amount: '', rate: '' });
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ type: 'trả lãi', amount: '' });

  // === LOGIC XỬ LÝ ĐĂNG NHẬP ===
  useEffect(() => {
    // Lấy phiên làm việc ngay khi tải trang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Đánh dấu đã tải xong thông tin session
    });

    // Lắng nghe các thay đổi về sau (đăng nhập, đăng xuất)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  // === CÁC HÀM LẤY DỮ LIỆU ===
  useEffect(() => {
    if(session) { // Chỉ lấy dữ liệu nếu đã đăng nhập
      if (!selectedCustomer) {
        fetchCustomers();
      } else {
        fetchCustomerDetails(selectedCustomer.id);
      }
    }
  }, [selectedCustomer, session]); // Chạy lại khi session hoặc selectedCustomer thay đổi

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  }

  async function fetchCustomerDetails(customerId) {
    const { data } = await supabase.from('loans').select('*').eq('customer_id', customerId);
    setLoans(data || []);
  }

  // === CÁC HÀM XỬ LÝ LOGIC KHÁC ===
  async function handleSelectLoan(loan) {
    setSelectedLoan(loan);
    const { data } = await supabase.from('transactions').select('*').eq('loan_id', loan.id).order('transaction_date');
    setTransactions(data || []);
  }

  async function handleAddCustomer(e) { e.preventDefault(); if (!newCustomer.name) return; await supabase.from('customers').insert([{ ...newCustomer, user_id: session.user.id }]); setNewCustomer({ name: '', phone: '', notes: '' }); fetchCustomers(); }
  async function handleAddLoan(e) { e.preventDefault(); const amount = parseInt(newLoan.amount); const rate = parseFloat(newLoan.rate); if (!amount || !rate) return; const { data: createdLoan } = await supabase.from('loans').insert({ customer_id: selectedCustomer.id, loan_amount: amount, interest_rate: rate }).select().single(); if (createdLoan) { await supabase.from('transactions').insert({ loan_id: createdLoan.id, transaction_type: 'giải ngân', amount: amount, transaction_date: new Date() }); } setNewLoan({ amount: '', rate: '' }); fetchCustomerDetails(selectedCustomer.id); }
  async function handleAddTransaction(e) { e.preventDefault(); const amount = parseInt(newTransaction.amount); if (!amount) return; await supabase.from('transactions').insert({ loan_id: selectedLoan.id, transaction_type: newTransaction.type, amount: amount, transaction_date: new Date() }); handleSelectLoan(selectedLoan); }
  function calculateCurrentPrincipal() { if (!transactions) return 0; return transactions.reduce((acc, tx) => { if (tx.transaction_type === 'giải ngân') return acc + tx.amount; if (tx.transaction_type === 'trả gốc') return acc - tx.amount; return acc; }, 0); }
  async function handleLogout() { await supabase.auth.signOut(); }


  // === PHẦN HIỂN THỊ GIAO DIỆN (VIEW) ===

  // Nếu đang chờ lấy thông tin session, hiển thị màn hình chờ
  if (loading) {
    return <div className="container"><p>Đang tải ứng dụng...</p></div>;
  }

  // Nếu không có session, hiển thị form đăng nhập
  if (!session) {
    return (
      <div className="auth-container">
        <h1>Quản lý Công nợ</h1>
        <p>Vui lòng đăng nhập để tiếp tục</p>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} localization={{ variables: { sign_in: { email_label: 'Địa chỉ email', password_label: 'Mật khẩu', button_label: 'Đăng nhập' }, sign_up: { email_label: 'Địa chỉ email', password_label: 'Mật khẩu', button_label: 'Đăng ký', link_text: 'Chưa có tài khoản? Đăng ký' } } }}/>
      </div>
    );
  }

  // Nếu đã có session, hiển thị giao diện quản lý
  // Giao diện chính - Danh sách khách hàng
  if (!selectedCustomer) {
    return (
      <div className="container">
        <button className="logout-button" onClick={handleLogout}>Đăng xuất</button>
        <h1>Bảng Công Nợ Khách Hàng</h1>
        {/* Phần tóm tắt có thể thêm lại ở đây nếu muốn */}
        <form onSubmit={handleAddCustomer} className="customer-form">
          <h3>Thêm khách hàng mới</h3>
          <input placeholder="Tên khách hàng" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
          <input placeholder="Số điện thoại" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
          <textarea placeholder="Ghi chú" value={newCustomer.notes} onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}></textarea>
          <button type="submit">Thêm khách hàng</button>
        </form>
        <div className="table-container">
          <table>
            <thead><tr><th>Tên khách hàng</th><th>Hành động</th></tr></thead>
            <tbody>{customers.map(c => <tr key={c.id}><td>{c.name}</td><td><button onClick={() => setSelectedCustomer(c)}>Xem Chi Tiết</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  } 
  // Giao diện chi tiết - Khi một khách hàng được chọn
  else {
    return (
      <div className="container">
        <div>
          <button onClick={() => setSelectedCustomer(null)}>&larr; Quay lại danh sách</button>
          <button className="logout-button" onClick={handleLogout}>Đăng xuất</button>
        </div>
        <h2>{selectedCustomer.name}</h2>
        <hr />
        <h3>Các khoản vay</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>ID</th><th>Số Tiền Vay</th><th>Hành động</th></tr></thead>
            <tbody>{loans.map(l => <tr key={l.id} className={selectedLoan?.id === l.id ? 'selected-row' : ''}><td>{l.id}</td><td>{l.loan_amount.toLocaleString()} VND</td><td><button onClick={() => handleSelectLoan(l)}>Xem giao dịch</button></td></tr>)}</tbody>
          </table>
        </div>
        <form onSubmit={handleAddLoan} className="customer-form">
          <input type="number" placeholder="Số tiền vay" value={newLoan.amount} onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })} />
          <input type="number" step="0.1" placeholder="Lãi suất" value={newLoan.rate} onChange={e => setNewLoan({ ...newLoan, rate: e.target.value })} />
          <button type="submit">Thêm khoản vay</button>
        </form>
        <hr />
        {selectedLoan && (
          <div className="transaction-section">
            <h3>Lịch sử giao dịch cho khoản vay #{selectedLoan.id}</h3>
            <div className="summary"><strong>Nợ gốc hiện tại: {calculateCurrentPrincipal().toLocaleString()} VND</strong></div>
            <form onSubmit={handleAddTransaction} className='customer-form'>
              <select value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}>
                <option value="trả lãi">Trả lãi</option><option value="trả gốc">Trả gốc</option>
              </select>
              <input type="number" placeholder="Số tiền" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
              <button type="submit">Lưu giao dịch</button>
            </form>
            <div className="table-container">
              <table><thead><tr><th>Ngày</th><th>Loại</th><th>Số Tiền</th></tr></thead>
              <tbody>{transactions.map(tx => <tr key={tx.id}><td>{new Date(tx.transaction_date).toLocaleString('vi-VN')}</td><td>{tx.transaction_type}</td><td>{tx.amount.toLocaleString()} VND</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;