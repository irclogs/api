/*
 * Low level wrappers over fetch to work with couchdb
 *
 */

import { Channel, Message, Query, ViewResponse, MessageViewResponse } from './types';
import { postQuery } from './post-query';

const commonQueryArgs = {
  include_docs: true,
  update_seq: true,
  reduce: false,
};

// hard-coded based on the Couch Application deployed
const COUCH_DESIGN_DOC = '_design/log/_view/channel';
const COUCH_URL = 'https://db.softver.org.mk/irclog/';

/**
 * FIXME: docs
 */
export class CouchDB {
  #couchUrl: URL;
  #designDoc: string;
  #queryUrl: URL;

  constructor(couchUrl: string, designDoc?: string) {
    this.#couchUrl = new URL(couchUrl);
    this.#designDoc = designDoc ?? COUCH_DESIGN_DOC;
    this.#queryUrl = new URL(this.#designDoc, this.#couchUrl);
  }

  async fetchViewLatest(channel: string, limit = 100): Promise<MessageViewResponse> {
    const query: Query = {
      ...commonQueryArgs,
      limit: limit,
      descending: true,
      startkey: [channel, {}],
      endkey: [channel, 0],
    };

    // FIXME: validation needed here
    const page = await postQuery(this.#queryUrl, query);
    page.rows.reverse();
    page.rows = page.rows.map((row: { doc: Message }) => row.doc);
    return page;
  }

  async fetchViewAtTimestamp(channel: string, timestamp: number, limit: number): Promise<MessageViewResponse> {
    const query: Query = {
      ...commonQueryArgs,
      limit: limit,
      descending: false,
      startkey: [channel, timestamp],
      endkey: [channel, {}],
    };

    // FIXME: validation needed here
    const page = await postQuery(this.#queryUrl, query);
    page.rows = page.rows.map((row: { doc: Message }) => row.doc);
    return page;
  }

  async fetchViewBefore(channel: string, firstRow: Message, limit: number): Promise<MessageViewResponse> {
    const query: Query = {
      ...commonQueryArgs,
      limit: limit,
      descending: true,
      skip: 1,
      startkey: [channel, firstRow.timestamp],
      startkey_docid: firstRow._id,
      endkey: [channel, 0],
    };

    // FIXME: validation needed here
    const view = await postQuery(this.#queryUrl, query);
    view.rows.reverse();
    view.rows = view.rows.map((row: { doc: Message }) => row.doc);
    return view;
  }

  async fetchViewAfter(channel: string, lastRow: Message, limit: number): Promise<MessageViewResponse> {
    const query: Query = {
      ...commonQueryArgs,
      limit: limit,
      descending: false,
      skip: 1,
      startkey: [channel, lastRow.timestamp],
      startkey_docid: lastRow._id,
      endkey: [channel, {}],
    };

    // FIXME: validation needed here
    const view = await postQuery(this.#queryUrl, query);
    view.rows = view.rows.map((row: { doc: Message }) => row.doc);
    return view;
  }

  async fetchChannelList(): Promise<Channel[]> {
    const query: Query = {
      update_seq: true,
      reduce: true,
      group_level: 1,
      include_docs: false,
    };

    // FIXME: validation needed here
    const chanList = (await postQuery(this.#queryUrl, query)) as ViewResponse<GroupLevel1Row>;
    return chanList.rows?.map(extractChannelData) ?? [];
  }
}

type GroupLevel1Row = { key: [string]; value: number };

function extractChannelData(row: GroupLevel1Row): Channel {
  return { channelName: row.key[0], totalMessages: row.value };
}
