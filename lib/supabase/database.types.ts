// Hand-written row types mirroring supabase/migrations/0001_init.sql.
// (In a full setup these would be generated via `supabase gen types`.)

export interface Database {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          title: string;
          description: string | null;
          status: "draft" | "published" | "closed";
          questions: unknown;
          logic_rules: unknown;
          theme: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["forms"]["Row"]> & {
          owner_id: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["forms"]["Row"]>;
      };
      responses: {
        Row: {
          id: string;
          form_id: string;
          session_id: string;
          completion_status: "in_progress" | "completed" | "abandoned";
          last_question_id: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["responses"]["Row"]> & {
          form_id: string;
          session_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["responses"]["Row"]>;
      };
      answers: {
        Row: {
          id: string;
          response_id: string;
          form_id: string;
          question_id: string;
          value: unknown;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["answers"]["Row"]> & {
          response_id: string;
          form_id: string;
          question_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["answers"]["Row"]>;
      };
    };
  };
}
