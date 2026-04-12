import React, { Suspense, lazy } from "react";

const MarkdownRenderer = lazy(async () => {
  const [{ default: ReactMarkdown }, { default: remarkGfm }] = await Promise.all([
    import("react-markdown"),
    import("remark-gfm"),
  ]);

  const Component: React.FC<{ children: string }> = ({ children }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  );

  return { default: Component };
});

type LazyMarkdownProps = {
  children: string;
};

const LazyMarkdown: React.FC<LazyMarkdownProps> = ({ children }) => (
  <Suspense fallback={<>{children}</>}>
    <MarkdownRenderer>{children}</MarkdownRenderer>
  </Suspense>
);

export default LazyMarkdown;