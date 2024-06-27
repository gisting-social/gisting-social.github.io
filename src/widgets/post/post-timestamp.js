// @ts-check

import React from 'react';
import { Link, useNavigate, useMatch, useMatches } from 'react-router-dom';

import { FormatTime } from '../format-time';
import { useDB } from '../..';
import { forAwait } from '../../../coldsky/src/api/forAwait';
import { breakFeedURIPostOnly, breakPostURL } from '../../../coldsky/lib';

/**
 * @param {{
 *  className?: string,
 *  post: import('../../../coldsky/lib').MatchCompactPost,
 *  since?: number,
 *  linkTimestamp?: boolean
 * }} _
 */
export function PostTimestamp({ className, post, since, linkTimestamp }) {
 if (!post.asOf) return null;

 if (!linkTimestamp) return <FormatTime className='post-date' time={post.asOf} />;

 const db = useDB();
 const profile = forAwait(post.shortDID, () => db.getProfileIncrementally(post.shortDID));

  const parsedURI = breakFeedURIPostOnly(post.uri);
  let aggregateClassName = className ? 'post-date ' + className : 'post-date';
  if (post.asOf && since && post.asOf - since >= 0 && post.asOf - since < 1000 * 60 * 20)
    aggregateClassName += ' post-date-new';

 return (
   <Link
     className={aggregateClassName}
     to={
       '/' + (profile?.handle || parsedURI?.shortDID) +
       '/' + parsedURI?.postID}>
     <FormatTime since={since} time={post.asOf} />
   </Link>
 );
}

/**
 * @param {{
 *  postURI: string | { postID: string, shortDID: string } | null | undefined
 * }} _
 */
export function PostLink({ postURI }) {
  const navigate = useNavigate();

  const parsedURI =
    typeof postURI === 'string' ?
      breakFeedURIPostOnly(postURI) || breakPostURL(postURI) :
      postURI;

  let localURL;
  let bskyURL;

  if (parsedURI) {
    // const matches = useMatches();
    // matches[0].
    localURL = '/' + parsedURI.shortDID + '/' + parsedURI.postID;
    bskyURL = '/' + parsedURI.shortDID + '/' + parsedURI.postID;
  }



}
