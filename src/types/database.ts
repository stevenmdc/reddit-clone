export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comments: {
        Relationships: [
          { foreignKeyName: 'comments_post_id_fkey'; columns: ['post_id']; isOneToOne: false; referencedRelation: 'posts'; referencedColumns: ['id'] },
          { foreignKeyName: 'comments_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
        Row: {
          created_at: string | null
          id: number
          post_id: number
          text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id: number
          text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: number
          text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      post_votes: {
        Relationships: [
          { foreignKeyName: 'post_votes_post_id_fkey'; columns: ['post_id']; isOneToOne: false; referencedRelation: 'posts'; referencedColumns: ['id'] },
          { foreignKeyName: 'post_votes_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
        Row: {
          created_at: string | null
          id: number
          is_upvote: boolean
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_upvote: boolean
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_upvote?: boolean
          post_id?: number
          user_id?: string
        }
      }
      posts: {
        Relationships: [
          { foreignKeyName: 'posts_posted_by_fkey'; columns: ['posted_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'posts_subreddit_fkey'; columns: ['subreddit']; isOneToOne: false; referencedRelation: 'subreddits'; referencedColumns: ['id'] }
        ]
        Row: {
          url: string | null
          created_at: string | null
          id: number
          image_url: string | null
          posted_by: string | null
          subreddit: number
          text: string | null
          title: string
        }
        Insert: {
          url?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          posted_by?: string | null
          subreddit: number
          text?: string | null
          title: string
        }
        Update: {
          url?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          posted_by?: string | null
          subreddit?: number
          text?: string | null
          title?: string
        }
      }
      profiles: {
        Relationships: []
        Row: {
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
        }
      }
      subreddits: {
        Relationships: []
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
