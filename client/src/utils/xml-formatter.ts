export function extractRoutineXML(
  originalXML: string,
  programName: string,
  routineName: string
): string | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(originalXML, 'text/xml');

    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return null;
    }

    // Find all Program elements
    const programs = xmlDoc.getElementsByTagName('Program');
    
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      const progName = program.getAttribute('Name');
      
      if (progName === programName) {
        // Find all Routine elements within this program
        const routines = program.getElementsByTagName('Routine');
        
        for (let j = 0; j < routines.length; j++) {
          const routine = routines[j];
          const routName = routine.getAttribute('Name');
          
          if (routName === routineName) {
            // Serialize the routine element
            const serializer = new XMLSerializer();
            const routineXML = serializer.serializeToString(routine);
            
            // Pretty print
            return prettyPrintXML(routineXML);
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting routine XML:', error);
    return null;
  }
}

function prettyPrintXML(xml: string): string {
  const PADDING = '  ';
  const reg = /(>)(<)(\/*)/g;
  let formatted = '';
  let pad = 0;

  xml = xml.replace(reg, '$1\n$2$3');
  
  const lines = xml.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let indent = 0;
    const line = lines[i];
    
    if (line.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (line.match(/^<\/\w/)) {
      if (pad !== 0) {
        pad -= 1;
      }
    } else if (line.match(/^<\w([^>]*[^\/])?>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    formatted += PADDING.repeat(pad) + line + '\n';
    pad += indent;
  }

  return formatted.trim();
}
