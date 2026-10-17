import SidebarLayout from "../components/SidebarLayout";
import DashboardRender from "./DashboardRender";

export default function Page() {
  return (
    <>
      <div className="w-full px-4 py-6">
        <SidebarLayout><DashboardRender /></SidebarLayout>
      </div>
    </>
  );
}