import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Component này nhận một "công tắc" tên là onSelectCustomer từ bên ngoài
export default function CustomerList({ onSelectCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', notes: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setNewCustomer({ ...newCustomer, [name]: value });
  }

  async function handleAddCustomer(event) {
    event.preventDefault();
    if (newCustomer.name.trim() === '') return;
    await supabase.from('customers').insert([newCustomer]);
    setNewCustomer({ name: '', phone: '', notes: '' });
    fetchCustomers();
  }

  return (
    <div>
      <form onSubmit={handleAddCustomer} className="customer-form">
        <h3>Thêm khách hàng mới</h3>
        <input name="name" placeholder="Tên khách hàng" value={newCustomer.name} onChange={handleInputChange} required />
        <input name="phone" placeholder="Số điện thoại" value={newCustomer.phone} onChange={handleInputChange} />
        <textarea name="notes" placeholder="Ghi chú" value={newCustomer.notes} onChange={handleInputChange}></textarea>
        <button type="submit">Thêm khách hàng</button>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Tên khách hàng</th>
              <th>Số điện thoại</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>
                  {/* Khi nhấn nút này, nó sẽ kích hoạt "công tắc" onSelectCustomer */}
                  <button onClick={() => onSelectCustomer(customer.id)}>
                    Xem & Quản lý nợ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}