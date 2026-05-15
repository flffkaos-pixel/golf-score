-- ==========================================================
-- Golf Score - Supabase 마이그레이션 (RLS 정책 수정)
-- ==========================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요.
-- (https://supabase.com > 프로젝트 > SQL Editor)
-- ==========================================================

-- 1. 기존 테이블과 정책 삭제 (재설치)
DROP POLICY IF EXISTS "competitions_select" ON competitions;
DROP POLICY IF EXISTS "competitions_insert" ON competitions;
DROP POLICY IF EXISTS "competitions_update" ON competitions;
DROP POLICY IF EXISTS "competitions_delete" ON competitions;
DROP POLICY IF EXISTS "competition_rounds_select" ON competition_rounds;
DROP POLICY IF EXISTS "competition_rounds_insert" ON competition_rounds;
DROP POLICY IF EXISTS "competition_rounds_update" ON competition_rounds;
DROP POLICY IF EXISTS "competition_rounds_delete" ON competition_rounds;
DROP POLICY IF EXISTS "friendships_select" ON friendships;
DROP POLICY IF EXISTS "friendships_insert" ON friendships;
DROP POLICY IF EXISTS "friendships_update" ON friendships;
DROP POLICY IF EXISTS "friendships_delete" ON friendships;
DROP POLICY IF EXISTS "friend_requests_select" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete" ON friend_requests;
DROP POLICY IF EXISTS "competition_invitations_select" ON competition_invitations;
DROP POLICY IF EXISTS "competition_invitations_insert" ON competition_invitations;
DROP POLICY IF EXISTS "competition_invitations_update" ON competition_invitations;
DROP POLICY IF EXISTS "competition_invitations_delete" ON competition_invitations;

-- 2. RLS 비활성화 (앱에서 직접 제어)
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE competition_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE competition_invitations DISABLE ROW LEVEL SECURITY;

-- 3. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_rounds;

SELECT 'Migration complete!' AS result;
