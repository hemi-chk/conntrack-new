export const Button = ({ title, onClick }) => {
  return (
    <button className="bg-blue-500 text-white p-2 rounded" onClick={onClick}>
      {title}
    </button>
  );
};