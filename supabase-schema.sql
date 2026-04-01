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

-- 대회: 누구나 읽기 가능 (공개 대회)
CREATE POLICY "competitions_select" ON competitions FOR SELECT USING (true);
CREATE POLICY "competitions_insert" ON competitions FOR INSERT WITH CHECK (true);
CREATE POLICY "competitions_update" ON competitions FOR UPDATE USING (true);
CREATE POLICY "competitions_delete" ON competitions FOR DELETE USING (true);

-- 대회 라운드
CREATE POLICY "competition_rounds_select" ON competition_rounds FOR SELECT USING (true);
CREATE POLICY "competition_rounds_insert" ON competition_rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "competition_rounds_update" ON competition_rounds FOR UPDATE USING (true);
CREATE POLICY "competition_rounds_delete" ON competition_rounds FOR DELETE USING (true);

-- 친구 관계
CREATE POLICY "friendships_select" ON friendships FOR SELECT USING (true);
CREATE POLICY "friendships_insert" ON friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "friendships_update" ON friendships FOR UPDATE USING (true);
CREATE POLICY "friendships_delete" ON friendships FOR DELETE USING (true);

-- 친구 요청
CREATE POLICY "friend_requests_select" ON friend_requests FOR SELECT USING (true);
CREATE POLICY "friend_requests_insert" ON friend_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "friend_requests_update" ON friend_requests FOR UPDATE USING (true);
CREATE POLICY "friend_requests_delete" ON friend_requests FOR DELETE USING (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
