export interface DailyReviewItem {
  id: string;
  date: string;
  log: string;
  insights: string;
  quote: string;
  type: 'daily';
}

export interface DeepReviewItem {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'deep';
}

export interface KnowledgeItem {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'knowledge';
}

export type ReviewItem = DailyReviewItem | DeepReviewItem | KnowledgeItem;

const STORAGE_KEY = 'rewind_reviews';

export const storage = {
  saveReview: (review: any) => {
    const reviews = storage.getReviews();
    const newReview = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    
    reviews.push(newReview as ReviewItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    return newReview;
  },

  getReviews: (): ReviewItem[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getDailyReviews: (): DailyReviewItem[] => {
    return storage.getReviews().filter(r => r.type === 'daily') as DailyReviewItem[];
  },

  getDeepReviews: (): DeepReviewItem[] => {
    return storage.getReviews().filter(r => r.type === 'deep') as DeepReviewItem[];
  },

  getKnowledgeItems: (): KnowledgeItem[] => {
    return storage.getReviews().filter(r => r.type === 'knowledge') as KnowledgeItem[];
  }
};
