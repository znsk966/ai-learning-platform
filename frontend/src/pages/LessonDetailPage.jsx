import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLessonById, markLessonAsViewed } from '../api/contentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

// Import the specific view components for each lesson type
import ReadingView from '../components/lessons/ReadingView';
import VideoView from '../components/lessons/VideoView';
import QuizView from '../components/lessons/QuizView';
import AITutorView from '../components/lessons/AITutorView';
import SimulationView from '../components/lessons/SimulationView';
import ProblemSolvingView from '../components/lessons/ProblemSolvingView';
import FileDownloadList from '../components/lessons/FileDownloadList';

const LessonDetailPage = () => {
  const { moduleId, submoduleId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLessonById(lessonId);
      setLesson(data);
      markLessonAsViewed(lessonId).catch(() => {});
    } catch (err) {
      console.error("Failed to fetch lesson:", err);
      setError("Could not load the lesson. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const renderLessonContent = () => {
    if (!lesson) return null;

    const backLink = submoduleId ? `/submodule/${submoduleId}` : `/modules/${moduleId}`;
    const backLinkLabel = submoduleId ? 'Back to Submodule' : 'Back to Module';

    switch (lesson.lesson_type) {
      case 'READ':
        return <ReadingView content={lesson.text_content} lessonId={lesson.id} backLink={backLink} backLinkLabel={backLinkLabel} />;
      case 'VID':
        return <VideoView lessonId={lesson.id} url={lesson.video_url} textContent={lesson.text_content} bunnyEmbedUrl={lesson.bunny_embed_url} backLink={backLink} backLinkLabel={backLinkLabel} />;
      case 'QUIZ':
        return <QuizView lessonId={lesson.id} onQuizComplete={(result) => {
          console.log('Quiz completed:', result);
          // You can add additional logic here like showing a success message
          // or automatically navigating to the next lesson
        }} />;
      case 'AI':
        return <AITutorView 
          lessonId={lesson.id} 
          lessonTitle={lesson.title}
          initialPrompt={lesson.ai_tutor_initial_prompt}
          aiConfig={lesson.ai_tutor_config}
          backLink={backLink}
          backLinkLabel={backLinkLabel}
        />;
      case 'SIM':
        return <SimulationView 
          lessonId={lesson.id}
          simulationUrl={lesson.simulation_url}
          textContent={lesson.text_content}
          backLink={backLink}
          backLinkLabel={backLinkLabel}
          onComplete={(result) => {
            console.log('Simulation completed:', result);
            // You can add additional logic here like showing a success message
            // or automatically navigating to the next lesson
          }}
        />;
      case 'PROB':
        return <ProblemSolvingView 
          lessonId={lesson.id}
          problemContent={lesson.text_content}
          backLink={backLink}
          backLinkLabel={backLinkLabel}
          onComplete={(result) => {
            console.log('Problem solving completed:', result);
            // You can add additional logic here like showing a success message
            // or automatically navigating to the next lesson
          }}
        />;
      default:
        return <p className="text-red-500">Error: This lesson type '{lesson.lesson_type}' is not supported yet.</p>;
    }
  };

  if (loading) return <LoadingSpinner text="Loading lesson..." />;
  if (error) return <ErrorDisplay title="Error Loading Lesson" message={error} onRetry={fetchLesson} />;
  if (!lesson) return <ErrorDisplay title="Not Found" message="Lesson not found." />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to={submoduleId ? `/submodule/${submoduleId}` : `/modules/${moduleId}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {submoduleId ? 'Submodule' : 'Module'}
        </Link>
      </div>

      <h1 className="mb-8 text-4xl font-bold text-gray-800 border-b border-gray-200 pb-4">{lesson.title}</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8">
        {renderLessonContent()}
      </div>

      {lesson.files && lesson.files.length > 0 && (
        <FileDownloadList files={lesson.files} />
      )}
    </div>
  );
};

export default LessonDetailPage;
