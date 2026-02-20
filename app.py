from flask import Flask, jsonify, request
from flask_cors import CORS
from bakong_khqr import KHQR
import requests
import datetime
import random

app = Flask(__name__)
CORS(app)

# --- កូដ API និងព័ត៌មានបាគង ---
BAKONG_TOKEN = "AIzaSyD0CoOErw8unJ2lGF3K4BqTAnq0eFq3ycI" # API ដើមរបស់អ្នក
MY_BAKONG_ID = "chorvy_tith@bkrt"
MY_PHONE = "012345678" 
TELEGRAM_BOT_TOKEN = "7759247656:AAHKv77V69v7n6v7v6v7v6v7v6v7v6v7v6"
GROUP_CHAT_ID = "-1003706120320"

khqr = KHQR(BAKONG_TOKEN)

def send_to_telegram(order_data):
    time_now = datetime.datetime.now().strftime("%H:%M:%S")
    msg = (
        f"🔔 *ការកុម្ម៉ង់ថ្មីជោគជ័យ!*\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🛒 *សេវាកម្ម:* {order_data.get('service')}\n"
        f"📦 *កញ្ចប់:* {order_data.get('plan')}\n"
        f"💵 *តម្លៃ:* ${order_data.get('amount')}\n"
        f"👤 *អតិថិជន:* `{order_data.get('user_info')}`\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"⏰ ម៉ោង: {time_now}"
    )
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": GROUP_CHAT_ID, "text": msg, "parse_mode": "Markdown"})
        print("🚀 បានផ្ញើទៅ Telegram រួចរាល់")
    except Exception as e:
        print(f"❌ កំហុសផ្ញើទៅ Telegram: {e}")

@app.route('/api/generate-qr', methods=['POST'])
def generate_qr():
    try:
        data = request.json
        amount = float(data.get('amount', 0))
        bill_no = f"INV{random.randint(1000, 9999)}"
        
        qr_data = khqr.create_qr(
            bank_account=MY_BAKONG_ID, merchant_name='Imra Store',
            merchant_city='Phnom Penh', amount=amount, currency='USD',
            store_label='Imra Store', terminal_label='Online',
            phone_number=MY_PHONE, bill_number=bill_no
        )
        
        md5_hash = khqr.generate_md5(qr_data)
        print(f"✅ QR បង្កើតរួចរាល់: {bill_no} | MD5: {md5_hash}")
        return jsonify({"qr_string": qr_data, "md5": md5_hash})
    except Exception as e:
        print(f"❌ Error បង្កើត QR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/check-status/<md5>', methods=['POST'])
def check_status(md5):
    try:
        status = "PENDING"
        try:
            status = khqr.check_payment(md5)
        except:
            status = "PENDING" 
            
        if status == "SUCCESS":
            send_to_telegram(request.json)
            print(f"💰 លុយចូលហើយសម្រាប់ MD5: {md5}")
            
        return jsonify({"status": status})
    except Exception as e:
        return jsonify({"status": "PENDING"}), 200

if __name__ == '__main__':
    print("--- Imra Store Backend Online (Port 5000) ---")
    app.run(host='0.0.0.0', port=5000)
      
