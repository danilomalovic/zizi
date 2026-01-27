import type { ParsedResult } from "./parser";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function instructionToText(instruction: any): string {
  if (!instruction || !instruction.type) return "";
  
  const type = instruction.type;
  const params: string[] = [];
  
  if (instruction.tag) params.push(instruction.tag);
  if (instruction.source) params.push(instruction.source);
  if (instruction.sourceA) params.push(instruction.sourceA);
  if (instruction.sourceB) params.push(instruction.sourceB);
  if (instruction.dest) params.push(instruction.dest);
  if (instruction.preset !== undefined) params.push(String(instruction.preset));
  if (instruction.accum !== undefined) params.push(String(instruction.accum));
  if (instruction.lowLimit !== undefined) params.push(String(instruction.lowLimit));
  if (instruction.highLimit !== undefined) params.push(String(instruction.highLimit));
  if (instruction.test !== undefined) params.push(String(instruction.test));
  if (instruction.routineName) params.push(instruction.routineName);
  
  if (params.length > 0) {
    return `${type}(${params.join(",")})`;
  }
  return type;
}

function rungToText(rung: { parsed: any[]; text?: string }): string {
  if (rung.text) return rung.text;
  
  if (!rung.parsed || rung.parsed.length === 0) return "";
  
  return rung.parsed.map(instructionToText).filter(Boolean).join(" ");
}

export function exportToL5X(data: ParsedResult): string {
  const lines: string[] = [];
  
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<RSLogix5000Content SchemaRevision="1.0" SoftwareRevision="30.00" TargetName="${escapeXml(data.controllerName)}" TargetType="Controller" ContainsContext="true" ExportDate="Exported" ExportOptions="References NoRawData L5KData DecoratedData Context Dependencies ForceProtectedEncoding AllProjDocTrans">`);
  lines.push(`  <Controller Name="${escapeXml(data.controllerName)}" Use="Target" ProcessorType="1756-L85E" MajorRev="30" MinorRev="11">`);
  
  lines.push('    <DataTypes/>');
  
  lines.push('    <Tags>');
  for (const tag of data.controllerTags) {
    lines.push(`      <Tag Name="${escapeXml(tag)}" TagType="Base" DataType="DINT" Radix="Decimal" Constant="false" ExternalAccess="Read/Write">`);
    lines.push('        <Data Format="L5K"><![CDATA[0]]></Data>');
    lines.push('      </Tag>');
  }
  lines.push('    </Tags>');
  
  lines.push('    <Programs>');
  for (const program of data.programs) {
    lines.push(`      <Program Name="${escapeXml(program.name)}" Type="Normal" MainRoutineName="${program.routines[0]?.name || 'Main'}" TestEdits="false">`);
    
    lines.push('        <Tags>');
    for (const tag of program.tags) {
      lines.push(`          <Tag Name="${escapeXml(tag)}" TagType="Base" DataType="DINT" Radix="Decimal" Constant="false" ExternalAccess="Read/Write">`);
      lines.push('            <Data Format="L5K"><![CDATA[0]]></Data>');
      lines.push('          </Tag>');
    }
    lines.push('        </Tags>');
    
    lines.push('        <Routines>');
    for (const routine of program.routines) {
      lines.push(`          <Routine Name="${escapeXml(routine.name)}" Type="RLL">`);
      lines.push('            <RLLContent>');
      
      for (const rung of routine.rungs) {
        const rungText = rungToText(rung);
        lines.push(`              <Rung Number="${rung.number}" Type="N">`);
        lines.push(`                <Text><![CDATA[${rungText};]]></Text>`);
        lines.push('              </Rung>');
      }
      
      lines.push('            </RLLContent>');
      lines.push('          </Routine>');
    }
    lines.push('        </Routines>');
    
    lines.push('      </Program>');
  }
  lines.push('    </Programs>');
  
  lines.push('  </Controller>');
  lines.push('</RSLogix5000Content>');
  
  return lines.join('\n');
}

export function downloadL5X(data: ParsedResult, fileName: string = "export.L5X"): void {
  const xml = exportToL5X(data);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
