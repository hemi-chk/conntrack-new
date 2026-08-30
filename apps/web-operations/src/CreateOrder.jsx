import { useState } from "react";
import { uploadFile } from "./services/api";

function CreateOrder({ onNavigate }) {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const initialState = {
    orderId: "Auto-generated",
    orderType: "",
    cargoType: "",
    cargoWeight: "",
    pickupDistrict: "",
    pickupLocation: "",
    destinationDistrict: "",
    destinationLocation: "",
    pickupDate: "",
    arrivalDate: "",
    vehicleSize: "",
    vehicleNo: "",
    notes: "",
    instructions: {
      fragileCargo: false,
      temperatureSensitive: false,
      handleWithCrane: false,
      priorityShipment: false,
    },
    documents: {
      commercialInvoice: null,
      packingList: null,
    },
  };

  const cargoTypes = [
    "Electronics",
    "Furniture",
    "Food Products",
    "Textiles",
    "Automobile Parts",
    "Machinery",
    "Construction Materials",
    "Chemicals",
    "Medical Supplies",
    "Agricultural Products",
    "Garments",
    "Plastic Products",
    "Rubber Products",
    "Paper Products",
    "Metal Products",
    "Wood Products",
    "Glass Products",
    "Cosmetics",
    "Pharmaceuticals",
    "Frozen Goods",
    "General Cargo",
  ];

  const districtLocations = {
    "Colombo District": [
      "Colombo Port",
      "Colombo City",
      "Orugodawatta Yard",
      "Ratmalana Industrial Area",
      "Pettah Warehouse",
      "Dematagoda Yard",
    ],
    "Gampaha District": [
      "Katunayake Airport",
      "Katunayake Export Zone",
      "Biyagama BOI Zone",
      "Ekala BOI Zone",
      "Peliyagoda Warehouse",
      "Wattala Industrial Area",
    ],
    "Kalutara District": [
      "Kalutara Industrial Area",
      "Panadura",
      "Horana Industrial Zone",
      "Beruwala",
    ],
    "Kandy District": [
      "Kandy City",
      "Peradeniya",
      "Katugastota",
      "Pallekele Industrial Zone",
    ],
    "Kurunegala District": [
      "Kurunegala Warehouse",
      "Kuliyapitiya",
      "Mawathagama Export Zone",
      "Pannala Industrial Area",
    ],
    "Galle District": [
      "Galle City",
      "Galle Port",
      "Koggala BOI Zone",
      "Hikkaduwa",
    ],
    "Matara District": [
      "Matara City",
      "Weligama",
      "Akuressa",
      "Dikwella",
    ],
    "Hambantota District": [
      "Hambantota Port",
      "Mattala Airport",
      "Tangalle",
      "Sooriyawewa",
    ],
    "Trincomalee District": [
      "Trincomalee Port",
      "China Bay",
      "Kinniya",
      "Kantale",
    ],
    "Jaffna District": [
      "Jaffna Town",
      "Kankesanthurai Port",
      "Chavakachcheri",
      "Point Pedro",
    ],
    "Anuradhapura District": [
      "Anuradhapura Town",
      "Medawachchiya",
      "Kekirawa",
      "Mihintale",
    ],
    "Batticaloa District": [
      "Batticaloa Town",
      "Eravur",
      "Kattankudy",
      "Valaichchenai",
    ],
  };

  const districts = Object.keys(districtLocations);

  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const availablePickupLocations = form.pickupDistrict
    ? districtLocations[form.pickupDistrict] || []
    : [];

  const availableDestinationLocations = form.destinationDistrict
    ? districtLocations[form.destinationDistrict] || []
    : [];

  const generateOrderId = async (type) => {
    try {
      setIsGeneratingId(true);

      const response = await fetch(
        `${API_BASE_URL}/api/operations/orders/next-id?type=${type.toLowerCase()}`
      );

      const responseText = await response.text();

      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Order ID API returned an invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate order ID");
      }

      if (!result.orderId) {
        throw new Error("Backend did not return a new order ID");
      }

      setForm((prev) => ({
        ...prev,
        orderType: type,
        orderId: result.orderId,
      }));
    } catch (error) {
      alert(error.message);
    } finally {
      setIsGeneratingId(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "pickupDate") {
      setForm((prev) => ({
        ...prev,
        pickupDate: value,
        arrivalDate:
          prev.arrivalDate && prev.arrivalDate < value
            ? ""
            : prev.arrivalDate,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePickupDistrictChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      pickupDistrict: value,
      pickupLocation: "",
    }));
  };

  const handleDestinationDistrictChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      destinationDistrict: value,
      destinationLocation: "",
    }));
  };

  const handleInstructionChange = (e) => {
    const { name, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      instructions: {
        ...prev.instructions,
        [name]: checked,
      },
    }));
  };

  const handleDocumentChange = (e) => {
    const { name, files } = e.target;
    const file = files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [name]: file,
      },
    }));
  };

  const validateForm = () => {
    if (
      !form.orderId ||
      form.orderId === "Auto-generated" ||
      !form.orderType
    ) {
      return "Please select Import or Export to generate the Order ID.";
    }

    if (!form.cargoType) {
      return "Please select a cargo type.";
    }

    if (!form.cargoWeight || Number(form.cargoWeight) <= 0) {
      return "Cargo weight must be greater than 0 kg.";
    }

    if (!form.pickupDistrict || !form.pickupLocation) {
      return "Please select the pickup district and pickup location.";
    }

    if (!form.destinationDistrict || !form.destinationLocation) {
      return "Please select the destination district and destination location.";
    }

    if (!form.pickupDate || !form.arrivalDate) {
      return "Please select the pickup date and expected arrival date.";
    }

    if (form.pickupDate < today) {
      return "Pickup date cannot be in the past.";
    }

    if (form.arrivalDate < form.pickupDate) {
      return "Expected arrival cannot be earlier than the pickup date.";
    }

    if (!form.vehicleSize) {
      return "Please select a vehicle type.";
    }

    if (!form.vehicleNo.trim()) {
      return "Please enter the container number.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedInstructions = Object.entries(form.instructions)
        .filter(([, value]) => value)
        .map(([key]) => key);

      const commercialInvoiceUrl = await uploadFile(
        "order-documents",
        form.documents.commercialInvoice,
        "commercial-invoices"
      );

      const packingListUrl = await uploadFile(
        "order-documents",
        form.documents.packingList,
        "packing-lists"
      );

      const payload = {
        order_reference: form.orderId,
        order_type: form.orderType.toLowerCase(),
        cargo_type: form.cargoType,
        cargo_weight: Number(form.cargoWeight),

        // Final Operations schema
        pickup_district: form.pickupDistrict,
        pickup_location: form.pickupLocation,
        destination_district: form.destinationDistrict,
        destination_location: form.destinationLocation,

        pickup_date: form.pickupDate,
        expected_arrival: form.arrivalDate,
        vehicle_type: form.vehicleSize,
        container_no: form.vehicleNo.trim(),
        commercial_invoice_url: commercialInvoiceUrl,
        packing_list_url: packingListUrl,
        special_instructions: [...selectedInstructions, form.notes.trim()]
          .filter(Boolean)
          .join(", "),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/operations/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Create Order API returned an invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to create order");
      }

      alert("Order created successfully.");

      setForm(initialState);

      if (onNavigate) {
        onNavigate("/orders");
      }
    } catch (error) {
      console.error("Create order error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm(initialState);
  };

  return (
    <div className="bg-[#EBF4FF] p-6 h-full overflow-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[#FFFFFF] rounded-xl shadow-md p-6 max-w-6xl mx-auto border border-[#BFDBFE]"
      >
        <h2 className="text-xl font-semibold text-[#1E293B] mb-6">
          Create New Order
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <Field label="Order Type">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => generateOrderId("Import")}
                disabled={isGeneratingId || isSubmitting}
                className={`px-5 py-2 rounded-md border font-medium transition-all duration-200 disabled:opacity-50 ${
                  form.orderType === "Import"
                    ? "bg-[#052659] text-[#FFFFFF] border-[#052659]"
                    : "bg-[#FFFFFF] text-[#1E293B] border-[#BFDBFE] hover:bg-[#EBF4FF]"
                }`}
              >
                Import
              </button>

              <button
                type="button"
                onClick={() => generateOrderId("Export")}
                disabled={isGeneratingId || isSubmitting}
                className={`px-5 py-2 rounded-md border font-medium transition-all duration-200 disabled:opacity-50 ${
                  form.orderType === "Export"
                    ? "bg-[#052659] text-[#FFFFFF] border-[#052659]"
                    : "bg-[#FFFFFF] text-[#1E293B] border-[#BFDBFE] hover:bg-[#EBF4FF]"
                }`}
              >
                Export
              </button>
            </div>
          </Field>

          <Field label="Order ID">
            <input
              name="orderId"
              value={isGeneratingId ? "Generating..." : form.orderId}
              disabled
              placeholder="Auto-generated by system"
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#EBF4FF] text-[#1E293B] outline-none cursor-not-allowed"
            />
          </Field>

          <Field label="Cargo Type">
            <select
              name="cargoType"
              value={form.cargoType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Cargo Type</option>

              {cargoTypes.map((cargoType) => (
                <option key={cargoType} value={cargoType}>
                  {cargoType}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cargo Weight (kg)">
            <input
              type="number"
              name="cargoWeight"
              value={form.cargoWeight}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="Enter Cargo Weight"
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            />
          </Field>

          <Field label="Pickup District">
            <select
              name="pickupDistrict"
              value={form.pickupDistrict}
              onChange={handlePickupDistrictChange}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Pickup District</option>

              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pickup Location">
            <select
              name="pickupLocation"
              value={form.pickupLocation}
              onChange={handleChange}
              disabled={!form.pickupDistrict}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF] disabled:bg-[#EFF6FF] disabled:cursor-not-allowed"
            >
              <option value="">
                {form.pickupDistrict
                  ? "Select Pickup Location"
                  : "Select Pickup District First"}
              </option>

              {availablePickupLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Destination District">
            <select
              name="destinationDistrict"
              value={form.destinationDistrict}
              onChange={handleDestinationDistrictChange}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Destination District</option>

              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Destination Location">
            <select
              name="destinationLocation"
              value={form.destinationLocation}
              onChange={handleChange}
              disabled={!form.destinationDistrict}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF] disabled:bg-[#EFF6FF] disabled:cursor-not-allowed"
            >
              <option value="">
                {form.destinationDistrict
                  ? "Select Destination Location"
                  : "Select Destination District First"}
              </option>

              {availableDestinationLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pickup Date">
            <input
              type="date"
              name="pickupDate"
              value={form.pickupDate}
              onChange={handleChange}
              min={today}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            />
          </Field>

          <Field label="Expected Arrival">
            <input
              type="date"
              name="arrivalDate"
              value={form.arrivalDate}
              onChange={handleChange}
              min={form.pickupDate || today}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            />
          </Field>

          <Field label="Vehicle Type">
            <select
              name="vehicleSize"
              value={form.vehicleSize}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Vehicle Type</option>
              <option value="HCV">HCV</option>
              <option value="LCV">LCV</option>
            </select>
          </Field>

          <Field label="Container No">
            <input
              name="vehicleNo"
              value={form.vehicleNo}
              onChange={handleChange}
              placeholder="Enter Container No"
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            />
          </Field>
        </div>

        <div className="mt-6">
          <label className="block mb-3 font-medium text-sm text-[#1E293B]">
            Upload Relevant Documents
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentUpload
              label="1. Commercial Invoice"
              name="commercialInvoice"
              file={form.documents.commercialInvoice}
              onChange={handleDocumentChange}
            />

            <DocumentUpload
              label="2. Packing List"
              name="packingList"
              file={form.documents.packingList}
              onChange={handleDocumentChange}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block mb-3 font-medium text-sm text-[#1E293B]">
            Special Instructions
          </label>

          <div className="border border-[#BFDBFE] rounded-lg p-4 bg-[#EBF4FF]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <CheckboxInstruction
                label="Fragile cargo"
                name="fragileCargo"
                checked={form.instructions.fragileCargo}
                onChange={handleInstructionChange}
              />

              <CheckboxInstruction
                label="Temperature sensitive"
                name="temperatureSensitive"
                checked={form.instructions.temperatureSensitive}
                onChange={handleInstructionChange}
              />

              <CheckboxInstruction
                label="Handle with crane"
                name="handleWithCrane"
                checked={form.instructions.handleWithCrane}
                onChange={handleInstructionChange}
              />

              <CheckboxInstruction
                label="Priority shipment"
                name="priorityShipment"
                checked={form.instructions.priorityShipment}
                onChange={handleInstructionChange}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block mb-2 font-medium text-sm text-[#1E293B]">
            Additional Instructions
          </label>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Enter any other special instructions here..."
            className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF] h-24"
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || isGeneratingId}
            className="px-6 py-2 border border-[#BFDBFE] rounded-md text-[#1E293B] bg-[#FFFFFF] hover:bg-[#EBF4FF] transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isGeneratingId}
            className="px-6 py-2 bg-[#052659] text-[#FFFFFF] rounded-md hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block mb-2 font-medium text-sm text-[#1E293B]">
        {label}
      </label>

      {children}
    </div>
  );
}

function DocumentUpload({ label, name, file, onChange }) {
  return (
    <div className="border border-[#BFDBFE] rounded-lg p-4 bg-[#FFFFFF]">
      <label className="block mb-2 font-medium text-sm text-[#1E293B]">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <label className="px-4 py-2 bg-[#EBF4FF] text-[#1E293B] border border-[#BFDBFE] rounded-md cursor-pointer hover:border-[#052659] transition">
          Choose File

          <input
            type="file"
            name={name}
            onChange={onChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </label>

        <span className="text-sm text-[#1E293B] break-all">
          {file ? file.name : "No file chosen"}
        </span>
      </div>
    </div>
  );
}

function CheckboxInstruction({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-[#052659]"
      />

      <span className="text-[#1E293B]">{label}</span>
    </label>
  );
}

export default CreateOrder;
