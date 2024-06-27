// @ts-check

import React from 'react';

import { useDB } from '..';
import { useForAwait } from '../../coldsky/src/api/forAwait';
import { ThreadView } from '../widgets/post/thread';
import { Visible } from '../widgets/visible';

import './timeline.css';

/**
 * @param {{
 *  shortDID: string,
 *  searchQuery?: string,
 * }} _
 */
export function Timeline({ shortDID, searchQuery }) {
  const db = useDB();

  const [retrieved, next] = useForAwait(
    shortDID + '\n' + searchQuery,
    () => getTimeline(shortDID, searchQuery));

  if (retrieved?.cachedOnly) {
    setTimeout(next, 300);
  }

  return (
    <div className='timeline-container'>
      {
        !retrieved?.timeline ? undefined :
        
          retrieved.timeline.map((thread, i) => (
            <ThreadView
              key={i}
              thread={thread}
              shortDID={shortDID}
              linkTimestamp={true}
              linkAuthor={true}
            />
          ))
      }
      <Visible
        onVisible={() =>
          next()
        }>
        <div className='timeline-bottom-visibility-spacer'>
          <div className='timeline-bottom-visibility-spacer-inner'>
            <Visible onVisible={next}>
              <div>&nbsp;</div>
            </Visible>
          </div>
        </div>
        <button onClick={() =>
          next()
        }>
          Search more...
        </button>
      </Visible>
    </div>
  );


  /**
   * @param {string} didOrHandle
   * @param {string | undefined} searchQuery
   */
  async function* getTimeline(didOrHandle, searchQuery) {
    try {
      let shortDID;
      for await (const profile of db.getProfileIncrementally(didOrHandle)) {
        if (profile.shortDID) {
          shortDID = profile.shortDID;
          break;
        }
      }

      /**
       * @type {import('../../coldsky/lib').CompactThreadPostSet[]}
       */
      let historicalPostThreads = [];
      /** @type {Set<string>} */
      const seenPosts = new Set();

      for await (const entries of db.searchPostsIncrementally(shortDID, searchQuery)) {
        if (!entries?.length) continue;

        entries.sort((p1, p2) => (p2.asOf || 0) - (p1.asOf || 0));

        /** @type {Map<string, import('../../coldsky/lib').CompactPost>} */
        const searchMatchPosts = new Map();
        for (const post of entries) {
          searchMatchPosts.set(post.uri, post);
        }

        for (const post of entries) {
          if (seenPosts.has(post.threadStart || post.uri)) continue;
          seenPosts.add(post.threadStart || post.uri);

          let postThreadRetrieved;
          for await (const postThread of db.getPostThreadIncrementally(post.uri)) {
            postThreadRetrieved = postThread;
          }

          if (!postThreadRetrieved) continue;
          postThreadRetrieved = {
            ...postThreadRetrieved,
            all: postThreadRetrieved.all.map(post => searchMatchPosts.get(post.uri) || post),
            current: searchMatchPosts.get(postThreadRetrieved.current.uri) || postThreadRetrieved.current,
            root: searchMatchPosts.get(postThreadRetrieved.root.uri) || postThreadRetrieved.root
          };

          historicalPostThreads.push(postThreadRetrieved);
          yield { timeline: historicalPostThreads, cachedOnly: entries.cachedOnly };
        }
      }
      console.log('timeline to end...');
    } finally {
      console.log('timeline finally');
    }
  }
}
