import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CustomerDetails({ customerId, onBack }) {
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('');
  
  // 1. Các "hộp trí nhớ" mới để quản lý giao dịch
  const [selectedLoan, setSelectedLoan] = useState(null); // Lưu khoản vay đang được xem
  const [transactions, setTransactions] = useState([]); // Lưu các giao dịch của khoản vay đó
  const [newTransaction, setNewTransaction] = useState({ type: 'trả lãi', amount: '' }); // Cho form giao dịch mới

  // Hàm lấy dữ liệu chính
  async function fetchData() {
    const { data: customerData } = await supabase.from('customers').select('*').eq('id', customerId).single();
    const { data: loansData } = await supabase.from('loans').select('*').eq('customer_id', customerId);
    setCustomer(customerData);
    setLoans(loansData || []);
  }

  useEffect(() => {
    fetchData();
  }, [customerId]);

  // 2. Hàm được gọi khi người dùng nhấn vào một khoản vay
  async function handleSelectLoan(loan) {
    setSelectedLoan(loan);
    const { data } = await supabase.from('transactions').select('*').eq('loan_id', loan.id).order('transaction_date');
    setTransactions(data || []);
  }

  // 3. Hàm thêm một giao dịch mới (trả lãi, trả gốc...)
  async function handleAddTransaction(e) {
    e.preventDefault();
    const amount = parseInt(newTransaction.amount);
    if (!amount) return;

    await supabase.from('transactions').insert({
      loan_id: selectedLoan.id,
      transaction_type: newTransaction.type,
      amount: amount,
      transaction_date: new Date()
    });
    
    // Tải lại giao dịch và xóa form
    handleSelectLoan(selectedLoan);
    setNewTransaction({ type: 'trả lãi', amount: '' });
  }

  // 4. Hàm tính toán nợ gốc hiện tại (Logic cốt lõi)
  function calculateCurrentPrincipal() {
    if (!transactions) return 0;
    let currentPrincipal = 0;
    transactions.forEach(tx => {
      if (tx.transaction_type === 'giải ngân') {
        currentPrincipal += tx.amount;
      } else if (tx.transaction_type === 'trả gốc') {
        currentPrincipal -= tx.amount;
      }
    });
    return currentPrincipal;
  }

  // ... (Hàm handleAddLoan vẫn giữ nguyên như cũ)
  async function handleAddLoan(e) { e.preventDefault(); const amount = parseInt(newLoanAmount); const rate = parseFloat(newInterestRate); if (!amount || !rate) { alert('Vui lòng nhập đầy đủ thông tin.'); return; } const { data: createdLoan, error: loanError } = await supabase.from('loans').insert({ customer_id: customerId, loan_amount: amount, interest_rate: rate }).select().single(); if (loanError) { console.error("Lỗi tạo khoản vay:", loanError); return; } const { error: transactionError } = await supabase.from('transactions').insert({ loan_id: createdLoan.id, transaction_type: 'giải ngân', amount: amount, transaction_date: new Date() }); if (transactionError) { console.error("Lỗi tạo giao dịch:", transactionError); } else { alert('Thêm khoản vay thành công!'); setNewLoanAmount(''); setNewInterestRate(''); fetchData(); } }

  if (!customer) return <p>Đang tải...</p>;

  return (
    <div>
      <button onClick={onBack}>&larr; Quay lại danh sách</button>
      <h2>{customer.name}</h2>
      <hr />

      {/* --- KHU VỰC QUẢN LÝ KHOẢN VAY --- */}
      <h3>Các khoản vay</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr><th>ID Khoản Vay</th><th>Số Tiền Vay</th><th>Lãi Suất</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.id} className={selectedLoan?.id === loan.id ? 'selected-row' : ''}>
                <td>{loan.id}</td>
                <td>{loan.loan_amount.toLocaleString()} VND</td>
                <td>{loan.interest_rate}</td>
                <td><button onClick={() => handleSelectLoan(loan)}>Xem giao dịch</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleAddLoan} className="customer-form">
        <input type="number" placeholder="Số tiền vay" value={newLoanAmount} onChange={(e) => setNewLoanAmount(e.target.value)} />
        <input type="number" step="0.1" placeholder="Lãi suất" value={newInterestRate} onChange={(e) => setNewInterestRate(e.target.value)} />
        <button type="submit">Thêm khoản vay</button>
      </form>
      <hr />

      {/* --- KHU VỰC QUẢN LÝ GIAO DỊCH (chỉ hiện ra khi một khoản vay được chọn) --- */}
      {selectedLoan && (
        <div className="transaction-section">
          <h3>Lịch sử giao dịch cho khoản vay #{selectedLoan.id}</h3>
          
          {/* Thông tin tổng kết */}
          <div className="summary">
            <strong>Nợ gốc hiện tại: {calculateCurrentPrincipal().toLocaleString()} VND</strong>
            {/* Việc tính lãi còn lại sẽ là một bài toán thú vị để bạn phát triển thêm! */}
          </div>

          {/* Form thêm giao dịch mới */}
          <form onSubmit={handleAddTransaction} className='customer-form'>
            <h4>Thêm giao dịch</h4>
            <select value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})}>
              <option value="trả lãi">Trả lãi</option>
              <option value="trả gốc">Trả gốc</option>
            </select>
            <input type="number" placeholder="Số tiền" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} />
            <button type="submit">Lưu giao dịch</button>
          </form>

          {/* Bảng lịch sử giao dịch */}
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Ngày</th><th>Loại Giao Dịch</th><th>Số Tiền</th></tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.transaction_date).toLocaleString('vi-VN')}</td>
                    <td>{tx.transaction_type}</td>
                    <td>{tx.amount.toLocaleString()} VND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}