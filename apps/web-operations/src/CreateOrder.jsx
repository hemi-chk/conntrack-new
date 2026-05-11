import { useState } from "react";
import { Country, State } from "country-state-city";

function CreateOrder({ onNavigate }) {
  // Initial form structure used to reset the form after submit/cancel
  const initialState = {
    orderId: "Auto-generated",
    orderType: "Export",
    cargoType: "",
    cargoWeight: "",
    pickupCountry: "",
    pickupState: "",
    destinationCountry: "",
    destinationState: "",
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

  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  // Prevents selecting previous dates for pickup/arrival
  const today = new Date().toISOString().split("T")[0];

  // Country and state data are loaded from country-state-city package
  const countries = Country.getAllCountries();

  const pickupStates = form.pickupCountry
    ? State.getStatesOfCountry(form.pickupCountry)
    : [];

  const destinationStates = form.destinationCountry
    ? State.getStatesOfCountry(form.destinationCountry)
    : [];

  // Converts country ISO code into readable country name before saving to database
  const getCountryName = (code) => {
    return Country.getCountryByCode(code)?.name || code;
  };

  // Calls backend API to generate the next Import/Export order ID
  const generateOrderId = async (type) => {
    try {
      setIsGeneratingId(true);

      const response = await fetch(
        `http://localhost:5000/api/operations/orders/next-id?type=${type.toLowerCase()}`
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

  // Validates form, prepares payload, and sends new order to backend
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
      !form.pickupCountry ||
      !form.pickupState ||
      !form.destinationCountry ||
      !form.destinationState ||
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

    // Converts selected checkbox instructions into an array
    const selectedInstructions = Object.entries(form.instructions)
      .filter(([, value]) => value)
      .map(([key]) => key);

    // Payload format matches backend/database column names
    const payload = {
      order_reference: form.orderId,
      order_type: form.orderType.toLowerCase(),
      cargo_type: form.cargoType,
      cargo_weight: Number(form.cargoWeight),
      pickup_country: getCountryName(form.pickupCountry),
      pickup_state: form.pickupState,
      destination_country: getCountryName(form.destinationCountry),
      destination_state: form.destinationState,
      pickup_date: form.pickupDate,
      expected_arrival: form.arrivalDate,
      vehicle_type: form.vehicleSize,
      container_no: form.vehicleNo,

      // Combines checkbox instructions and additional notes into one text field
      special_instructions: [...selectedInstructions, form.notes]
        .filter(Boolean)
        .join(", "),
    };

    try {
      setIsSubmitting(true);

      const response = await fetch("http://localhost:5000/api/operations/orders", {
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
    <div className="bg-[#EFF6FF] p-6 h-full overflow-auto">
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
                    ? "bg-[#1E40AF] text-[#FFFFFF] border-[#1E40AF]"
                    : "bg-[#FFFFFF] text-[#1E293B] border-[#BFDBFE] hover:bg-[#EFF6FF]"
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
                    ? "bg-[#1E40AF] text-[#FFFFFF] border-[#1E40AF]"
                    : "bg-[#FFFFFF] text-[#1E293B] border-[#BFDBFE] hover:bg-[#EFF6FF]"
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
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#EFF6FF] text-[#1E293B] outline-none cursor-not-allowed"
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

          <Field label="Pickup Country">
            <select
              name="pickupCountry"
              value={form.pickupCountry}
              onChange={(e) =>
                setForm({
                  ...form,
                  pickupCountry: e.target.value,
                  pickupState: "",
                })
              }
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pickup State / District">
            <select
              name="pickupState"
              value={form.pickupState}
              onChange={handleChange}
              disabled={!form.pickupCountry}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF] disabled:bg-[#EFF6FF]"
            >
              <option value="">Select State</option>
              {pickupStates.map((state) => (
                <option key={state.isoCode} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Destination Country">
            <select
              name="destinationCountry"
              value={form.destinationCountry}
              onChange={(e) =>
                setForm({
                  ...form,
                  destinationCountry: e.target.value,
                  destinationState: "",
                })
              }
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Destination State / District">
            <select
              name="destinationState"
              value={form.destinationState}
              onChange={handleChange}
              disabled={!form.destinationCountry}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF] disabled:bg-[#EFF6FF]"
            >
              <option value="">Select State</option>
              {destinationStates.map((state) => (
                <option key={state.isoCode} value={state.name}>
                  {state.name}
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

          <div className="border border-[#BFDBFE] rounded-lg p-4 bg-[#EFF6FF]">
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
            className="px-6 py-2 border border-[#BFDBFE] rounded-md text-[#1E293B] bg-[#FFFFFF] hover:bg-[#EFF6FF] transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isGeneratingId}
            className="px-6 py-2 bg-[#1E40AF] text-[#FFFFFF] rounded-md hover:opacity-90 transition disabled:opacity-50"
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
        <label className="px-4 py-2 bg-[#EFF6FF] text-[#1E293B] border border-[#BFDBFE] rounded-md cursor-pointer hover:border-[#1E40AF] transition">
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
        className="w-4 h-4 accent-[#1E40AF]"
      />

      <span className="text-[#1E293B]">{label}</span>
    </label>
  );
}

export default CreateOrder;