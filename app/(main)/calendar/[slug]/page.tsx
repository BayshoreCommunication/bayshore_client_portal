import BookCall from "@/component/calendar/BookCall";

const BookCallPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  return <BookCall slug={slug} />;
};

export default BookCallPage;
