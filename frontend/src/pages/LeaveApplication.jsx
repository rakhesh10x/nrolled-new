import { useNavigate } from "react-router-dom";
import LeaveForm from "../components/leave/LeaveForm";
import PageTransition from "../components/common/PageTransition";

export default function LeaveApplication() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/leave/history");
  };

  return (
    <PageTransition>
      <div className="py-6">
        <LeaveForm onSuccess={handleSuccess} />
      </div>
    </PageTransition>
  );
}
