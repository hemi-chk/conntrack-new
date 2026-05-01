import { useState } from "react";
import { Country, State } from "country-state-city";

function CreateOrder({ onNavigate }) {
  const initialState = {
    orderId: "",
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
      boiClearance: null,
      portGatePass: null,
      packingList: null,
    },
  };

  const [form, setForm] = useState(initialState);

  const today = new Date().toISOString().split("T")[0];
  const countries = Country.getAllCountries();

  const pickupStates = form.pickupCountry
    ? State.getStatesOfCountry(form.pickupCountry)
    : [];

  const destinationStates = form.destinationCountry
    ? State.getStatesOfCountry(form.destinationCountry)
    : [];

  const generateOrderId = (type) => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${type === "Import" ? "IMP" : "EXP"}-${random}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.orderId || !form.cargoType) {
      alert("Please fill required fields");
      return;
    }

    const selectedInstructions = Object.entries(form.instructions)
      .filter(([, value]) => value)
      .map(([key]) => key);

    const newOrder = {
      id: form.orderId,
      type: form.orderType,
      supplier: "-",
      driver: "-",
      pickup: form.pickupState || "-",
      destination: form.destinationState || "-",
      status: "Created",
      cargoType: form.cargoType,
      cargoWeight: form.cargoWeight,
      pickupDate: form.pickupDate,
      arrivalDate: form.arrivalDate,
      vehicleSize: form.vehicleSize,
      vehicleNo: form.vehicleNo,
      notes: form.notes,
      selectedInstructions,
      vehicle: {
        insurance: "-",
        portPass: "-",
        condition: "-",
      },
      driverDetails: {
        name: "-",
        license: "-",
        policeReport: "-",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 0,
    };

    const existingOrders =
      JSON.parse(localStorage.getItem("createdOrders")) || [];

    localStorage.setItem(
      "createdOrders",
      JSON.stringify([newOrder, ...existingOrders])
    );

    alert("Order Created Successfully!");

    setForm(initialState);

    if (onNavigate) {
      onNavigate("/orders");
    }
  };

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
                onClick={() =>
                  setForm({
                    ...form,
                    orderType: "Import",
                    orderId: generateOrderId("Import"),
                  })
                }
                className={`px-5 py-2 rounded-md border font-medium transition-all duration-200 ${
                  form.orderType === "Import"
                    ? "bg-[#1E40AF] text-[#FFFFFF] border-[#1E40AF]"
                    : "bg-[#FFFFFF] text-[#1E293B] border-[#BFDBFE] hover:bg-[#EFF6FF]"
                }`}
              >
                Import
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    orderType: "Export",
                    orderId: generateOrderId("Export"),
                  })
                }
                className={`px-5 py-2 rounded-md border font-medium transition-all duration-200 ${
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
              value={form.orderId}
              onChange={handleChange}
              placeholder="EXP-1023"
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
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
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Food Products</option>
              <option>Textiles</option>
              <option>Automobile Parts</option>
            </select>
          </Field>

          <Field label="Cargo Weight (kg)">
            <input
              type="number"
              name="cargoWeight"
              value={form.cargoWeight}
              onChange={handleChange}
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
              <option>20ft Container</option>
              <option>40ft Container</option>
              <option>Flatbed Trailer</option>
              <option>Special Vehicle</option>
            </select>
          </Field>

          <Field label="Container No">
            <select
              name="vehicleNo"
              value={form.vehicleNo}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#BFDBFE] rounded-lg bg-[#FFFFFF] text-[#1E293B] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#EFF6FF]"
            >
              <option value="">Select Container No</option>
              <option>WP-AB-1234</option>
              <option>CP-CD-5678</option>
              <option>SP-EF-9012</option>
              <option>NP-GH-3456</option>
            </select>
          </Field>
        </div>

        <div className="mt-6">
          <label className="block mb-3 font-medium text-sm text-[#1E293B]">
            Upload Relevant Documents
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentUpload label="1. Commercial Invoice" name="commercialInvoice" file={form.documents.commercialInvoice} onChange={handleDocumentChange} />
            <DocumentUpload label="2. BOI Clearance" name="boiClearance" file={form.documents.boiClearance} onChange={handleDocumentChange} />
            <DocumentUpload label="3. Port Gate Pass" name="portGatePass" file={form.documents.portGatePass} onChange={handleDocumentChange} />
            <DocumentUpload label="4. Packing List" name="packingList" file={form.documents.packingList} onChange={handleDocumentChange} />
          </div>
        </div>

        <div className="mt-6">
          <label className="block mb-3 font-medium text-sm text-[#1E293B]">
            Special Instructions
          </label>

          <div className="border border-[#BFDBFE] rounded-lg p-4 bg-[#EFF6FF]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <CheckboxInstruction label="Fragile cargo" name="fragileCargo" checked={form.instructions.fragileCargo} onChange={handleInstructionChange} />
              <CheckboxInstruction label="Temperature sensitive" name="temperatureSensitive" checked={form.instructions.temperatureSensitive} onChange={handleInstructionChange} />
              <CheckboxInstruction label="Handle with crane" name="handleWithCrane" checked={form.instructions.handleWithCrane} onChange={handleInstructionChange} />
              <CheckboxInstruction label="Priority shipment" name="priorityShipment" checked={form.instructions.priorityShipment} onChange={handleInstructionChange} />
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
            className="px-6 py-2 border border-[#BFDBFE] rounded-md text-[#1E293B] bg-[#FFFFFF] hover:bg-[#EFF6FF] transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-[#1E40AF] text-[#FFFFFF] rounded-md hover:opacity-90 transition"
          >
            Create & Submit to Logistics
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
        <label className="px-4 py-2 bg-[#EFF6FF] text-[#1E293B] border border-[#BFDBFE] rounded-md cursor-pointer hover:border-[#1E40AF] transition">
          Choose File
          <input type="file" name={name} onChange={onChange} className="hidden" />
        </label>

        <span className="text-sm text-[#1E293B]">
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
        className="w-4 h-4 accent-[#1E40AF]"
      />
      <span className="text-[#1E293B]">{label}</span>
    </label>
  );
}

export default CreateOrder;