import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 1. .env 파일의 값을 제대로 읽어오는지 확인용 로그
console.log("URL 체크:", import.meta.env.VITE_SUPABASE_URL);

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [testData, setTestData] = useState<any>(null);
  const [errorLog, setErrorLog] = useState<string>("");

  useEffect(() => {
    async function checkConnection() {
      // 2. 실제 테이블 하나를 찔러봅니다 (본인의 테이블명으로 바꾸세요)
      const { data, error } = await supabase.from('members').select('*').limit(1);
      
      if (error) {
        setErrorLog(error.message);
        console.error("연결 에러 세부내용:", error);
      } else {
        setTestData(data);
        console.log("연결 성공 데이터:", data);
      }
    }
    checkConnection();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>로스트아크 길드 홈페이지 연결 테스트</h1>
      
      {errorLog && (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
          <strong>에러 발생:</strong> {errorLog}
          <p>팁: .env 파일 이름이 정확한지, RLS 설정이 되어있는지 확인하세요.</p>
        </div>
      )}

      {testData ? (
        <div style={{ color: 'green' }}>
          ✅ 연결 성공! 데이터가 들어오고 있습니다.
          <pre>{JSON.stringify(testData, null, 2)}</pre>
        </div>
      ) : (
        !errorLog && <p>데이터를 불러오는 중...</p>
      )}
    </div>
  )
}

export default App
