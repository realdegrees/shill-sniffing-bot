/* eslint-disable max-len */
import environment from './environment';

const DAYS_TO_MS_MULTIPLIER = 24 * 60 * 60 * 1000;

const getPostsTable = (posts: Posts): string => `GME Subreddits | Anti GME Subreddits | Finance Subreddits | Other | Total  
  :--:|:--:|:--:|:--:|:--:  
  ${posts.totalInGenericGME}|${posts.totalInAntiGME}|${posts.totalInGenericGME}|${posts.totalInOther}|**${posts.totalInTimeFrame}**`;

export default (review: UserReview): string => `*Sniff Sniff*\n
  Automated review of u/${review.username} from the past **${environment.TIME_FRAME_MS / DAYS_TO_MS_MULTIPLIER} days**\n
  - Account age in days: **${review.accountAge.toFixed(2)}**.  
  - Actively posted in **${review.uniqueSubreddits.length}** unique subreddits.  
  - Reports received in GME subs: **${review.reportsReceivedGME}**  
  - Mentions of price in context of *'selling, floor or ceiling'*:  
    **${review.priceSentiment.join(', ')}**\n
  **Post Quantity**\n
  ${getPostsTable(review.posts)}\n
  **Votes Received in GME Subreddits**  
  Average upvotes: ${review.voting.avgUpvotesReceivedInGenericGME}  
  Median upvotes: ${review.voting.medianUpvotesReceivedInGenericGME}  
  Average downvotes: ${review.voting.avgDownvotesReceivedInGenericGME}  
  Median downvotes: ${review.voting.medianDownvotesReceivedInGenericGME}\n
  **Sentiment Analysis** *(-5 Negative, +5 Positive)*  
  Score overall: ${review.sentimentAll}  
  Score in GME subs: ${review.sentimentGME}`;
