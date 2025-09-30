import React from "react";

const PopupMessage = ({ message, type = "success", onClose }) => {
  let bgColor = "";

  switch (type) {
    case "success":
      bgColor = "bg-green-100 border-green-500 text-green-700";
      break;
    case "error":
      bgColor = "bg-red-100 border-red-500 text-red-700";
      break;
    case "warning":
      bgColor = "bg-yellow-100 border-yellow-500 text-yellow-700";
      break;
    default:
      bgColor = "bg-gray-100 border-gray-500 text-gray-700";
  }

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`border-l-4 p-4 rounded shadow-lg flex items-center justify-between ${bgColor}`}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 font-bold focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PopupMessage;
