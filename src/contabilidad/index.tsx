import SidebarLayout from "../components/SidebarLayout";
import LibrosContables from "./components/LibrosContables";

export default function Page() {
  return (
    <>
      <div className="w-full">
        <SidebarLayout>
          <LibrosContables />
        </SidebarLayout>
      </div>
    </>
  );
}
