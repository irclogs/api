import { Query } from './types';

/**
 * Helper function to send a query to the irc log CouchDB View using an http post request
 *
 * https://docs.couchdb.org/en/stable/api/ddoc/views.html#querying-views-and-indexes
 * https://docs.couchdb.org/en/stable/ddocs/views/intro.html
 *
 * @param url
 * @param query
 * @returns A Fetch API Response - query results
 */
export async function postQuery(url: URL, query: Query) {
  const options: RequestInit = {
    mode: 'cors',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
  };

  const response = await fetch(url, {
    ...options,
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  return response.json();
}
