-- 대회 테이블
CREATE TABLE IF NOT EXISTS competitions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  player_ids TEXT[] NOT NULL DEFAULT '{}',
  player_names TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 대회 라운드(점수) 테이블
CREATE TABLE IF NOT EXISTS competition_rounds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  holes JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  total_par INTEGER NOT NULL,
  relative_score INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 친구 관계 테이블 (양방향)
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  friend_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- 친구 요청 테이블
CREATE TABLE IF NOT EXISTS friend_requests (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
   from_user_id TEXT NOT NULL,
   from_user_name TEXT NOT NULL,
   to_user_id TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'pending',
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE(from_user_id, to_user_id)
);

-- 대회 초대 테이블
CREATE TABLE IF NOT EXISTS competition_invitations (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
   competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
   competition_name TEXT NOT NULL,
   from_user_id TEXT NOT NULL,
   from_user_name TEXT NOT NULL,
   to_user_id TEXT NOT NULL,
   to_user_name TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'pending',
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE(competition_id, to_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_competitions_host ON competitions(host_id);
CREATE INDEX IF NOT EXISTS idx_competitions_players ON competitions USING GIN(player_ids);
CREATE INDEX IF NOT EXISTS idx_competition_rounds_comp ON competition_rounds(competition_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id);

-- RLS 정책
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- 대회: 호스트만 수정 가능, 누구나 읽기 가능 (공개 대회)
CREATE POLICY "competitions_select" ON competitions FOR SELECT USING (true);
CREATE POLICY "competitions_insert" ON competitions FOR INSERT WITH CHECK (true);
CREATE POLICY "competitions_update" ON competitions FOR UPDATE USING (auth.uid()::text = host_id);
CREATE POLICY "competitions_delete" ON competitions FOR DELETE USING (auth.uid()::text = host_id);

-- 대회 라운드: 자신이 생성한 라운드만 수정 가능
CREATE POLICY "competition_rounds_select" ON competition_rounds FOR SELECT USING (true);
CREATE POLICY "competition_rounds_insert" ON competition_rounds FOR INSERT WITH CHECK (auth.uid()::text = player_id);
CREATE POLICY "competition_rounds_update" ON competition_rounds FOR UPDATE USING (auth.uid()::text = player_id);
CREATE POLICY "competition_rounds_delete" ON competition_rounds FOR DELETE USING (auth.uid()::text = player_id);

-- 친구 관계: 자신이 관련된 관계만 볼 수 있고 수정 가능
CREATE POLICY "friendships_select" ON friendships FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);
CREATE POLICY "friendships_insert" ON friendships FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "friendships_update" ON friendships FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "friendships_delete" ON friendships FOR DELETE USING (auth.uid()::text = user_id);

-- 친구 요청: 수신자만 볼 수 있고 수정 가능, 발신자만 생성 가능
CREATE POLICY "friend_requests_select" ON friend_requests FOR SELECT USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);
CREATE POLICY "friend_requests_insert" ON friend_requests FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);
CREATE POLICY "friend_requests_update" ON friend_requests FOR UPDATE USING (auth.uid()::text = to_user_id); -- 수신자만 상태 변경 가능
CREATE POLICY "friend_requests_delete" ON friend_requests FOR DELETE USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);

-- 대회 초대: 발신자는 생성 가능, 수신자는 볼 수 있고 상태만 수정 가능
CREATE POLICY "competition_invitations_select" ON competition_invitations FOR SELECT USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);
CREATE POLICY "competition_invitations_insert" ON competition_invitations FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);
CREATE POLICY "competition_invitations_update" ON competition_invitations FOR UPDATE USING (auth.uid()::text = to_user_id); -- 수신자만 상태 변경 가능
CREATE POLICY "competition_invitations_delete" ON competition_invitations FOR DELETE USING (auth.uid()::text = from_user_id);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_invitations;
