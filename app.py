from flask import Flask, render_template, request, jsonify, redirect, url_for
from database import init_db, add_user, get_user, update_user_points, add_withdrawal, get_all_withdrawals, get_all_users
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key

# Initialize database
init_db()

# Home page - Main app
@app.route('/')
def index():
    return render_template('index.html')

# Admin panel
@app.route('/admin')
def admin():
    return render_template('admin.html')

# Withdrawal page
@app.route('/withdraw')
def withdraw():
    return render_template('withdraw.html')

# API: Add or update user
@app.route('/api/user', methods=['POST'])
def api_user():
    data = request.json
    user_id = data.get('user_id')
    username = data.get('username', 'Unknown')
    
    user = get_user(user_id)
    if not user:
        add_user(user_id, username)
        return jsonify({'status': 'created', 'points': 0})
    return jsonify({'status': 'exists', 'points': user[2]})

# API: Update points (called when user watches ad)
@app.route('/api/add_points', methods=['POST'])
def api_add_points():
    data = request.json
    user_id = data.get('user_id')
    points = int(data.get('points', 1))
    
    user = get_user(user_id)
    if user:
        new_points = user[2] + points
        update_user_points(user_id, new_points)
        return jsonify({'status': 'success', 'new_points': new_points})
    return jsonify({'status': 'error', 'message': 'User not found'}), 404

# API: Submit withdrawal request
@app.route('/api/withdraw', methods=['POST'])
def api_withdraw():
    data = request.json
    user_id = data.get('user_id')
    method = data.get('method')  # 'bikash' or 'nagad'
    number = data.get('number')
    amount = float(data.get('amount'))
    
    user = get_user(user_id)
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
    
    if user[2] < amount:
        return jsonify({'status': 'error', 'message': 'Insufficient points'}), 400
    
    # Deduct points
    new_points = user[2] - amount
    update_user_points(user_id, new_points)
    
    # Add withdrawal request
    add_withdrawal(user_id, user[1], method, number, amount)
    
    return jsonify({'status': 'success', 'message': 'Withdrawal request submitted'})

# API: Get all withdrawals (for admin)
@app.route('/api/admin/withdrawals', methods=['GET'])
def api_get_withdrawals():
    withdrawals = get_all_withdrawals()
    return jsonify([{
        'id': w[0],
        'user_id': w[1],
        'username': w[2],
        'method': w[3],
        'number': w[4],
        'amount': w[5],
        'status': w[6],
        'created_at': w[7]
    } for w in withdrawals])

# API: Get all users (for admin)
@app.route('/api/admin/users', methods=['GET'])
def api_get_users():
    users = get_all_users()
    return jsonify([{
        'user_id': u[0],
        'username': u[1],
        'points': u[2],
        'created_at': u[3]
    } for u in users])

# API: Update withdrawal status
@app.route('/api/admin/withdrawal/<int:id>', methods=['PUT'])
def api_update_withdrawal(id):
    data = request.json
    status = data.get('status')  # 'pending', 'completed', 'rejected'
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('UPDATE withdrawals SET status = ? WHERE id = ?', (status, id))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)