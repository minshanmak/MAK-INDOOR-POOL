"use client";

import React from "react";
import AuditLogsView from "@/components/admin/AuditLogsView";

export default function AdminAuditLogsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      <AuditLogsView showHeader={true} />
    </div>
  );
}
