import { Navbar } from "./_components/navbar";
import { Container } from "./_components/container";

const BrowseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className="flex h-full pt-20">
        <Container>{children}</Container>
      </div>
    </>
  );
};

export default BrowseLayout;
