export type Channel = {
  channelName: string;
  totalMessages: number;
};

export type Message = {
  timestamp: number;
  sender: string;
  channel: string;
  message: string;
  _id: string;
};

// TODO: map all from here: https://docs.couchdb.org/en/stable/api/ddoc/views.html#db-design-design-doc-view-view-name
export type Query = {
  include_docs: boolean;
  update_seq: boolean;
  reduce: boolean;
  group_level?: number;
  limit?: number;
  skip?: number;
  descending?: boolean;
  startkey?: any;
  endkey?: any;
  startkey_docid?: any;
  endkey_docid?: any;
  //   [key: string]: any;
};

// CouchDB Result schema
export type ViewResponse<TRow> = {
  rows: TRow[];
  update_seq: string;
  total_rows?: number;
  offset?: number;
};

export type MessageViewResponse = {
  channel: string;
} & ViewResponse<Message>;
