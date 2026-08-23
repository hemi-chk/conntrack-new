import { useState } from "react";
import { uploadFile } from "./services/api";

function CreateOrder({ onNavigate }) {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
  // Initial form structure used to reset the form after submit/cancel
  const initialState = {
    orderId: "Auto-generated",
    orderType: "Export",
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

  // Fixed cargo category list shown in the Cargo Type dropdown
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

  // Sri Lanka district and location data
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

  // Prevents selecting previous dates for pickup/arrival
  const today = new Date().toISOString().split("T")[0];

  // Pickup locations load only after pickup district is selected
  const availablePickupLocations = form.pickupDistrict
    ? districtLocations[form.pickupDistrict] || []
    : [];

  // Destination locations load only after destination district is selected
  const availableDestinationLocations = form.destinationDistrict
    ? districtLocations[form.destinationDistrict] || []
    : [];

  // Calls backend API to generate the next Import/Export order ID
  const generateOrderId = async (type) => {
    try {
      setIsGeneratingId(true);

      const response = await fetch(
        `${API_BASE_URL}/api/operations/orders/next-id?type=${type.toLowerCase()}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate order ID");
      }

      // Updates order type and auto-generated order reference
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

  // Handles normal input/select changes and validates cargo weight
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cargoWeight") {
      if (value === "") {
        setForm({
          ...form,
          cargoWeight: "",
        });
        return;
      }

      const numericValue = Number(value);

      if (numericValue <= 0) {
        setForm({
          ...form,
          cargoWeight: "",
        });
        alert("Cargo weight must be greater than 0 kg");
        return;
      }
    }

    setForm({
      ...form,
      [name]: value,
    });
  };

  // Handles pickup district change and resets pickup location
  const handlePickupDistrictChange = (e) => {
    setForm({
      ...form,
      pickupDistrict: e.target.value,
      pickupLocation: "",
    });
  };

  // Handles destination district change and resets destination location
  const handleDestinationDistrictChange = (e) => {
    setForm({
      ...form,
      destinationDistrict: e.target.value,
      destinationLocation: "",
    });
  };

  // Updates special instruction checkbox values
  const handleInstructionChange = (e) => {
    const { name, checked } = e.target;

    setForm({
      ...form,
      instructions: {
        ...form.instructions,
        [name]: checked,
      },
    });
  };

  // Stores selected document files in form state
  const handleDocumentChange = (e) => {
    const { name, files } = e.target;

    setForm({
      ...form,
      documents: {
        ...form.documents,
        [name]: files && files[0] ? files[0] : null,
      },
    });
  };

  // Validates form, uploads documents, prepares payload, and sends new order to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required field validation before sending data to backend
    if (
      !form.orderId ||
      form.orderId === "Auto-generated" ||
      !form.orderType ||
      !form.cargoType ||
      !form.cargoWeight ||
      Number(form.cargoWeight) <= 0 ||
      !form.pickupDistrict ||
      !form.pickupLocation ||
      !form.destinationDistrict ||
      !form.destinationLocation ||
      !form.pickupDate ||
      !form.arrivalDate ||
      !form.vehicleSize ||
      !form.vehicleNo
    ) {
      alert(
        "Please select Import or Export to generate Order ID and fill all required fields correctly"
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Converts selected checkbox instructions into an array
      const selectedInstructions = Object.entries(form.instructions)
        .filter(([, value]) => value)
        .map(([key]) => key);

      // Upload documents directly from browser to Supabase Storage
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

      // Uses the final Operations database column names.
      const payload = {
        order_reference: form.orderId,
        order_type: form.orderType.toLowerCase(),
        cargo_type: form.cargoType,
        cargo_weight: Number(form.cargoWeight),

        pickup_district: form.pickupDistrict,
        pickup_location: form.pickupLocation,
        destination_district: form.destinationDistrict,
        destination_location: form.destinationLocation,

        pickup_date: form.pickupDate,
        expected_arrival: form.arrivalDate,
        vehicle_type: form.vehicleSize,
        container_no: form.vehicleNo,

        commercial_invoice_url: commercialInvoiceUrl,
        packing_list_url: packingListUrl,

        special_instructions: [...selectedInstructions, form.notes]
          .filter(Boolean)
          .join(", "),
      };

      const response = await fetch(`${API_BASE_URL}/api/operations/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create order");
      }

      alert("Order created successfully and saved to database!");

      // Clears form after successful order creation
      setForm(initialState);

      // Redirects user to Orders page after order is created
      if (onNavigate) {
        onNavigate("/orders");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clears all form fields without submitting
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

        <div className="grid grid-cols-2 gap-5 text-sm">
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

          <Field label="Vehicle Size">
            <select
              name="vehicleSize"
              value={form.vehicleSize}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Vehicle</option>
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
            {isSubmitting ? "Creating..." : "Create & Submit to Logistics"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Reusable wrapper for form label + input/select field
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

// Reusable upload component for order documents
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
          />
        </label>

        <span className="text-sm text-[#1E293B]">
          {file ? file.name : "No file chosen"}
        </span>
      </div>
    </div>
  );
}

// Reusable checkbox component for special instruction options
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