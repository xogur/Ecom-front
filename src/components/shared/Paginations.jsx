// src/components/shared/Paginations.jsx
import { Pagination } from "@mui/material";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const Paginations = ({ numberOfPage, totalProducts, onChange }) => {
  const [searchParams] = useSearchParams();
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const page = Number(searchParams.get("page") || 1);

  const defaultChange = (_e, value) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", value.toString());
    navigate(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination
      count={Number(numberOfPage || 1)}
      page={page}
      defaultPage={1}
      siblingCount={0}
      boundaryCount={2}
      shape="rounded"
      onChange={onChange || defaultChange}
    />
  );
};

export default Paginations;
