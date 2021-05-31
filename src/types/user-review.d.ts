interface UserReview {
  username: string;
  accountAge: number;
  uniqueSubreddits: string[];
  priceSentiment: string[];
  sentimentAll: number;
  sentimentGME: number;
  voting: Voting;
  posts: Posts;
  reportsReceivedGME: number;
}
