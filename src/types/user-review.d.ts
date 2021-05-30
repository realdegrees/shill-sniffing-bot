interface UserReview {
  accountAge: number;
  uniqueSubreddits: number;
  floor: Floor;
  sentiment: {
    selling: number,
    buying: number
  }
  posts: Posts,
  voting: Voting,
  reportsReceived: number,
}
