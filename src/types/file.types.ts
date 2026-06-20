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
}

export interface Tag {
  id?: number;
  name: string;
}

export interface WatchFolder {
  id?: number;
  path: string;
}
