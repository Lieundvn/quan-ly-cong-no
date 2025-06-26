import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import './App.css'; // ĐÃ THÊM LẠI DÒNG NÀY ĐỂ CÓ MÀU SẮC

export default function Dashboard({ session }) {
  const [customersWithAlerts, setCustomersWithAlerts] = useState([]);
  const [summaryData, setSummaryData] = useState({ total_loaned: 0, total_accrued_interest: 0 });
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', notes: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState({ amount: '', rate: '' });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ type: 'trả lãi', amount: '' });

  async function fetchData() {
    const { data: customersData } = await supabase.rpc('get_customers_with_alert_status');
    setCustomersWithAlerts(customersData || []);

    const { data: summary } = await supabase.rpc('get_dashboard_summary');
    if (summary) {
      setSummaryData(summary);
    }
  }

  useEffect(() => {
    if (!selectedCustomer) {
      fetchData();
    }
  }, [selectedCustomer]);

  async function fetchCustomerDetails(customerId) {
    const { data } = await supabase.from('loans').select('*').eq('customer_id', customerId);
    setLoans(data || []);
  }

  async function handleSelectCustomer(customer) {
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer.id);
  }

  async function handleSelectLoan(loan) {
    setSelectedLoan(loan);
    const { data } = await supabase.from('transactions').select('*').eq('loan_id', loan.id).order('transaction_date');
    setTransactions(data || []);
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!newCustomer.name) return;
    await supabase.from('customers').insert([{ ...newCustomer, user_id: session.user.id }]);
    setNewCustomer({ name: '', phone: '', notes: '' });
    fetchData();
  }

  async function handleAddLoan(e) {
    e.preventDefault();
    const amount = parseInt(newLoan.amount);
    const rate = parseFloat(newLoan.rate);
    if (!amount || !rate) return;
    const { data: createdLoan } = await supabase.from('loans').insert({ customer_id: selectedCustomer.id, loan_amount: amount, interest_rate: rate }).select().single();
    if (createdLoan) {
      await supabase.from('transactions').insert({ loan_id: createdLoan.id, transaction_type: 'giải ngân', amount: amount, transaction_date: new Date() });
    }
    setNewLoan({ amount: '', rate: '' });
    fetchCustomerDetails(selectedCustomer.id);
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    const amount = parseInt(newTransaction.amount);
    if (!amount) return;
    await supabase.from('transactions').insert({ loan_id: selectedLoan.id, transaction_type: newTransaction.type, amount: amount, transaction_date: new Date() });
    handleSelectLoan(selectedLoan);
  }

  function calculateCurrentPrincipal() {
    if (!transactions) return 0;
    return transactions.reduce((acc, tx) => {
      if (tx.transaction_type === 'giải ngân') return acc + tx.amount;
      if (tx.transaction_type === 'trả gốc') return acc - tx.amount;
      return acc;
    }, 0);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const AlertBadge = ({ days_overdue }) => {
    if (!days_overdue || days_overdue <= 0) {
      return <span className="alert-badge green">Đúng hạn</span>;
    }
    const level = Math.floor((days_overdue - 1) / 30) + 1;
    return <span className="alert-badge red" title={`Quá hạn ${days_overdue} ngày`}>{level}</span>;
  };

  // === CẤU TRÚC HIỂN THỊ ĐÚNG ===
  if (!selectedCustomer) {
    // Giao diện chính - Danh sách khách hàng
    return (
      <>
        <button className="logout-button" onClick={handleLogout}>Đăng xuất</button>
        <h1>Bảng Công Nợ Khách Hàng</h1>
        <div className="summary-section">
          <div className="summary-box">
            <h4>Tổng Tiền Đã Vay</h4>
            <p>{summaryData.total_loaned.toLocaleString()} VND</p>
          </div>
          <div className="summary-box">
            <h4>Tổng Lãi Tạm Tính Đến Nay</h4>
            <p>{Math.round(summaryData.total_accrued_interest).toLocaleString()} VND</p>
          </div>
        </div>
        <form onSubmit={handleAddCustomer} className="customer-form">
          <h3>Thêm khách hàng mới</h3>
          <input placeholder="Tên khách hàng" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
          <input placeholder="Số điện thoại" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
          <textarea placeholder="Ghi chú" value={newCustomer.notes} onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}></textarea>
          <button type="submit">Thêm khách hàng</button>
        </form>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên khách hàng</th>
                <th>Tình trạng</th>
                <th>Số điện thoại</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {customersWithAlerts.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td><AlertBadge days_overdue={c.days_overdue} /></td>
                  <td>{c.phone}</td>
                  <td><button onClick={() => handleSelectCustomer(c)}>Xem Chi Tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else {
    // Giao diện chi tiết - Khi một khách hàng được chọn
    return (
      <>
        <div>
          <button onClick={() => setSelectedCustomer(null)}>&larr; Quay lại danh sách</button>
          <button className="logout-button" onClick={handleLogout}>Đăng xuất</button>
        </div>
        <h2>{selectedCustomer.name}</h2>
<div className="summary-box details-summary">
  <h4>Tổng tiền khách này đã vay</h4>
  <p>{selectedCustomer.total_loan_amount ? selectedCustomer.total_loan_amount.toLocaleString() : 0} VND</p>
</div>
        {selectedCustomer.days_overdue > 0 && (
          <div className="alert-details">
            CẢNH BÁO: Khách hàng này đã quá hạn trả lãi <strong>{selectedCustomer.days_overdue} ngày</strong>.
            Kỳ hạn cuối được tính là ngày {new Date(selectedCustomer.earliest_due_date).toLocaleDateString('vi-VN')}.
          </div>
        )}
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
      </>
    );
  }
}