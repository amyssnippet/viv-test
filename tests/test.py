import requests
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Config
URL = "https://suspected-brooklyn-township-salary.trycloudflare.com/api/chat"
HEADERS = {
    "Content-Type": "application/json"
}
PAYLOAD = {
    "model": "numax",
    "messages": [
        {"role": "user", "content": "why is the sky blue?"}
    ]
}

# Stress test parameters
CONCURRENT_REQUESTS = 5  # Number of threads / concurrent users
TOTAL_REQUESTS = 100       # Total requests to send

def send_request(session, retries=3):
    for attempt in range(retries):
        try:
            response = session.post(
                URL,
                headers=HEADERS,
                data=json.dumps(PAYLOAD),
                timeout=20  # ⏱️ Wait up to 20 seconds
            )
            if response.status_code == 200:
                return response.status_code, response.elapsed.total_seconds()
            else:
                time.sleep(1)  # Wait a bit before retry
        except Exception as e:
            time.sleep(1)
    return "Timeout/Error", 0


def stress_test():
    start_time = time.time()
    successes = 0
    failures = 0
    total_time = 0

    with requests.Session() as session:
        with ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
            futures = [executor.submit(send_request, session) for _ in range(TOTAL_REQUESTS)]

            for future in as_completed(futures):
                status, elapsed = future.result()
                if status == 200:
                    successes += 1
                else:
                    failures += 1
                    print(f"Failed request: {status}")
                total_time += elapsed

    duration = time.time() - start_time
    print("\n--- Stress Test Summary ---")
    print(f"Total Requests Sent: {TOTAL_REQUESTS}")
    print(f"Successful Responses: {successes}")
    print(f"Failed Responses: {failures}")
    print(f"Total Time Taken: {duration:.2f}s")
    print(f"Avg Response Time: {total_time / TOTAL_REQUESTS:.2f}s")

if __name__ == "__main__":
    stress_test()
