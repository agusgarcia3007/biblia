-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_persona TEXT,
  locale TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  grounding_refs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayers table
CREATE TABLE IF NOT EXISTS prayers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_key TEXT NOT NULL,
  intent_tag TEXT NOT NULL,
  content TEXT NOT NULL,
  grounding_refs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chat', 'prayer', 'verse')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bible verses table with vector embeddings
CREATE TABLE IF NOT EXISTS bible_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book TEXT NOT NULL,
  book_order INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_deuterocanon BOOLEAN DEFAULT FALSE,
  embedding vector(1536) -- dimension depends on embedding model
);

-- Saint personas table
CREATE TABLE IF NOT EXISTS saints_personas (
  key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  style_card TEXT NOT NULL,
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_prayers_user_id ON prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter_verse ON bible_verses(book_order, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_id ON subscriptions(polar_subscription_id);

-- Vector similarity search index (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_bible_verses_embedding ON bible_verses
USING hnsw (embedding vector_cosine_ops);

-- RLS (Row Level Security) Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Prayers
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prayers"
  ON prayers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prayers"
  ON prayers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayers"
  ON prayers FOR DELETE
  USING (auth.uid() = user_id);

-- Journal entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Bible verses (public read access)
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bible verses"
  ON bible_verses FOR SELECT
  USING (true);

-- Saint personas (public read access)
ALTER TABLE saints_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view saint personas"
  ON saints_personas FOR SELECT
  USING (true);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_bible_verses(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  book text,
  chapter int,
  verse int,
  text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bible_verses.id,
    bible_verses.book,
    bible_verses.chapter,
    bible_verses.verse,
    bible_verses.text,
    1 - (bible_verses.embedding <=> query_embedding) as similarity
  FROM bible_verses
  WHERE 1 - (bible_verses.embedding <=> query_embedding) > match_threshold
  ORDER BY bible_verses.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, locale)
  VALUES (NEW.id, 'es');

  INSERT INTO public.streaks (user_id, current_streak, last_active_date)
  VALUES (NEW.id, 0, CURRENT_DATE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
