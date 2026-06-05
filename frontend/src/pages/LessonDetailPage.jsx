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
  const [tutorOpen, setTutorOpen] = useState(false);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTutorOpen(false);
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

  const isAI = lesson.lesson_type === 'AI';

  // Surface the AI tutor as a side panel on READ and QUIZ lessons, but only when
  // the lesson actually has tutor context configured.
  const showTutorPanel =
    (lesson.lesson_type === 'READ' || lesson.lesson_type === 'QUIZ') &&
    Boolean(lesson.ai_tutor_initial_prompt || lesson.ai_tutor_config);

  return (
    <div className="max-w-5xl mx-auto">
      <div className={isAI ? 'mb-1' : 'mb-6'}>
        <Link to={submoduleId ? `/submodule/${submoduleId}` : `/modules/${moduleId}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {submoduleId ? 'Submodule' : 'Module'}
        </Link>
      </div>

      {!isAI && (
        <h1 className="mb-8 pb-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 border-b border-gray-200">{lesson.title}</h1>
      )}
      
      <div className={isAI ? '' : 'bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8'}>
        {renderLessonContent()}
      </div>

      {lesson.files && lesson.files.length > 0 && (
        <FileDownloadList files={lesson.files} />
      )}

      {showTutorPanel && (
        <>
          {/* Floating toggle button */}
          {!tutorOpen && (
            <button
              type="button"
              onClick={() => setTutorOpen(true)}
              className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
              aria-label="Open AI Tutor"
            >
              <span aria-hidden="true">💬</span>
              <span className="hidden sm:inline font-medium">Ask AI Tutor</span>
            </button>
          )}

          {/* Slide-over drawer */}
          {tutorOpen && (
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="AI Tutor">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setTutorOpen(false)}
              />
              {/* Panel */}
              <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <h2 className="text-base font-semibold text-gray-800">AI Tutor</h2>
                  <button
                    type="button"
                    onClick={() => setTutorOpen(false)}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close AI Tutor"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 min-h-0 p-3">
                  <AITutorView
                    embedded
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    aiConfig={lesson.ai_tutor_config}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LessonDetailPage;
