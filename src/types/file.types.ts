/**
 * Tipe data domain: Berkas (file, tag, watch folder)
 */

export interface File {
  id?: number;
  path: string;
  filename: string;
  type: string;
  project_id?: number;
  status: string;
  version_label?: string;
  last_modified: string;
  modified_by?: string;
  is_readonly: boolean;
  description?: string;
  responsible_parties?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id?: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface WatchFolder {
  id?: number;
  path: string;
  created_at?: string;
  updated_at?: string;
}
