import pandas as pd
import numpy as np
import sqlalchemy
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from typing import Dict, Any, List, Tuple

class NestFestMLPipeline:
    """
    Comprehensive ML Pipeline for NestFest Competition Platform
    
    Key Responsibilities:
    - Data Ingestion
    - Feature Engineering
    - Preprocessing
    - Model Preparation
    - Ethical AI Considerations
    """
    
    def __init__(self, db_connection: str):
        """
        Initialize ML Pipeline with database connection
        
        Args:
            db_connection (str): SQLAlchemy database connection string
        """
        self.engine = sqlalchemy.create_engine(db_connection)
        self.feature_store = {}
    
    def load_competition_data(self, competition_id: int) -> pd.DataFrame:
        """
        Load comprehensive competition data
        
        Args:
            competition_id (int): Unique identifier for the competition
        
        Returns:
            pd.DataFrame: Loaded competition dataset
        """
        query = f"""
        SELECT 
            submissions.*,
            users.role,
            users.registration_date,
            votes.vote_type,
            votes.timestamp as vote_timestamp,
            judges.expertise_areas
        FROM submissions
        JOIN users ON submissions.user_id = users.id
        LEFT JOIN votes ON submissions.id = votes.submission_id
        LEFT JOIN judges ON submissions.judge_id = judges.id
        WHERE submissions.competition_id = {competition_id}
        """
        return pd.read_sql(query, self.engine)
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create advanced features for ML models
        
        Args:
            df (pd.DataFrame): Input dataframe
        
        Returns:
            pd.DataFrame: Dataframe with engineered features
        """
        # Temporal Features
        df['submission_age_days'] = (pd.Timestamp.now() - pd.to_datetime(df['submission_date'])).dt.days
        
        # Vote-related Features
        df['vote_count'] = df.groupby('submission_id')['vote_type'].transform('count')
        df['vote_diversity'] = df.groupby('submission_id')['user_role'].transform('nunique')
        
        # User Reputation Features
        df['user_submission_count'] = df.groupby('user_id')['submission_id'].transform('count')
        df['user_avg_vote_score'] = df.groupby('user_id')['vote_type'].transform('mean')
        
        # Categorical Encoding
        categorical_cols = ['category', 'user_role', 'submission_type']
        for col in categorical_cols:
            df[f'{col}_encoded'] = LabelEncoder().fit_transform(df[col].fillna('Unknown'))
        
        return df
    
    def detect_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect potential anomalies in submissions and voting
        
        Args:
            df (pd.DataFrame): Input dataframe
        
        Returns:
            pd.DataFrame: Dataframe with anomaly scores
        """
        # IP Clustering Anomaly Detection
        df['ip_vote_frequency'] = df.groupby('ip_address')['vote_type'].transform('count')
        df['ip_anomaly_score'] = np.where(
            df['ip_vote_frequency'] > df['ip_vote_frequency'].quantile(0.95), 
            1, 0
        )
        
        # Rapid Voting Anomaly
        df['vote_time_diff'] = df.groupby('submission_id')['vote_timestamp'].diff().dt.total_seconds()
        df['rapid_vote_anomaly'] = np.where(
            df['vote_time_diff'] < 5, 1, 0  # Votes within 5 seconds
        )
        
        return df
    
    def preprocess_for_model(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare data for machine learning models
        
        Args:
            df (pd.DataFrame): Input dataframe
        
        Returns:
            Tuple of feature matrix and target variable
        """
        # Select relevant features
        features = [
            'submission_age_days', 'vote_count', 'vote_diversity', 
            'user_submission_count', 'user_avg_vote_score',
            'category_encoded', 'user_role_encoded', 
            'ip_anomaly_score', 'rapid_vote_anomaly'
        ]
        
        # Target could be fraud likelihood or vote credibility
        df['vote_credibility'] = np.where(
            (df['ip_anomaly_score'] == 1) | (df['rapid_vote_anomaly'] == 1), 
            0, 1
        )
        
        X = df[features]
        y = df['vote_credibility']
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        return X_scaled, y
    
    def generate_ethical_report(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate an ethical AI assessment report
        
        Args:
            df (pd.DataFrame): Input dataframe
        
        Returns:
            Ethical assessment dictionary
        """
        return {
            'total_submissions': len(df),
            'unique_users': df['user_id'].nunique(),
            'role_distribution': df['user_role'].value_counts(normalize=True).to_dict(),
            'potential_bias_indicators': {
                'submissions_by_role': df.groupby('user_role')['submission_id'].count(),
                'vote_distribution': df.groupby('user_role')['vote_type'].mean()
            },
            'anomaly_rate': (df['ip_anomaly_score'].sum() / len(df)) * 100
        }

def main():
    """
    Example usage of NestFest ML Pipeline
    """
    # Replace with actual database connection string
    DB_CONNECTION = 'postgresql://username:password@localhost/nestfest'
    
    # Initialize Pipeline
    ml_pipeline = NestFestMLPipeline(DB_CONNECTION)
    
    # Load Competition Data
    competition_data = ml_pipeline.load_competition_data(competition_id=1)
    
    # Feature Engineering
    enriched_data = ml_pipeline.engineer_features(competition_data)
    
    # Anomaly Detection
    anomaly_data = ml_pipeline.detect_anomalies(enriched_data)
    
    # Preprocess for Model
    X, y = ml_pipeline.preprocess_for_model(anomaly_data)
    
    # Ethical Assessment
    ethical_report = ml_pipeline.generate_ethical_report(anomaly_data)
    print("Ethical AI Report:", ethical_report)

if __name__ == '__main__':
    main()