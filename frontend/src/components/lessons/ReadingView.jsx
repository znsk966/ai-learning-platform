import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

const ReadingView = ({ content }) => {
  const contentRef = useRef(null);
  
  // Split content by delimiter (------ or ---)
  const steps = useMemo(() => {
    if (!content) return [];
    
    // Split by horizontal rule delimiter (------ or ---)
    // This is a common markdown delimiter
    const delimiter = /^---+$/gm;
    const parts = content.split(delimiter).map(part => part.trim()).filter(part => part.length > 0);
    
    // If no delimiter found, return single step with all content
    if (parts.length <= 1) {
      return [{ content: content.trim(), title: null }];
    }
    
    // Extract titles from first line of each step (if it's a heading)
    return parts.map((part, index) => {
      const lines = part.split('\n');
      let title = null;
      let content = part;
      
      // Check if first line is a heading (# Title or ## Title)
      if (lines[0] && lines[0].match(/^#{1,6}\s+/)) {
        title = lines[0].replace(/^#+\s+/, '');
        content = lines.slice(1).join('\n').trim();
      } else {
        // Use generic step title
        title = `Step ${index + 1}`;
      }
      
      return { content, title };
    });
  }, [content]);

  const [currentStep, setCurrentStep] = useState(0);
  const hasMultipleSteps = steps.length > 1;

  // Scroll to top when step changes
  useEffect(() => {
    // Use setTimeout to ensure content is rendered before scrolling
    const timer = setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback to window scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentStep]);

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  return (
    <div className="max-w-4xl mx-auto" ref={contentRef}>
      {/* Progress Indicator - Only show if multiple steps */}
      {hasMultipleSteps && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          
          {/* Step Navigation Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step Title */}
      {hasMultipleSteps && steps[currentStep].title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-3">
            {steps[currentStep].title}
          </h2>
        </div>
      )}

      {/* Content */}
      <article className="prose prose-lg prose-slate max-w-none
        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-8 prose-headings:mb-4
        prose-h1:text-3xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-gray-800
        prose-ul:list-disc prose-ul:my-4 prose-ul:pl-6
        prose-ol:list-decimal prose-ol:my-4 prose-ol:pl-6
        prose-li:text-gray-700 prose-li:my-2 prose-li:leading-relaxed
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:my-4
        prose-hr:border-gray-300 prose-hr:my-8
        prose-img:rounded-lg prose-img:shadow-md prose-img:my-6">
        <ReactMarkdown
          children={steps[currentStep].content}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, '')}
                  style={materialDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                />
              ) : (
                <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-sm font-mono font-medium" {...props}>
                  {children}
                </code>
              );
            },
          }}
        />
      </article>

      {/* Navigation Buttons - Only show if multiple steps */}
      {hasMultipleSteps && (
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="text-sm text-gray-500">
            {currentStep + 1} / {steps.length}
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === steps.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadingView;