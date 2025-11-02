import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Search, User, Eye, FileText, Brain, X } from 'lucide-react';

const mockPatientDatabase = [
  {
    id: 'P-2024-001',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@email.com',
    address: '123 Main St, Boston, MA 02101',
    visits: [
      { 
        visitId: 'V-001', 
        date: '2024-10-02', 
        reason: 'Chest X-ray scan', 
        notes: 'Normal findings',
        reportPdf: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table.pdf'
      },
      { 
        visitId: 'V-002', 
        date: '2024-10-15', 
        reason: 'Follow-up', 
        notes: 'Patient reports improvement',
        aiPrediction: 'Clinical improvement noted. No new abnormalities detected.',
        reportPdf: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table.pdf'
      }
    ]
  },
  {
    id: 'P-2024-002',
    name: 'Jane Smith',
    age: 38,
    gender: 'Female',
    phone: '+1 (555) 987-6543',
    email: 'jane.smith@email.com',
    address: '456 Oak Ave, Cambridge, MA 02139',
    visits: [
      { 
        visitId: 'V-003', 
        date: '2024-10-01', 
        reason: 'Brain MRI', 
        notes: 'Small white matter lesions',
        reportPdf: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table.pdf'
      }
    ]
  }
];

export default function PatientRevisitSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState(mockPatientDatabase);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handleViewReport = (reportUrl) => {
    if (reportUrl) {
      setPdfUrl(reportUrl);
      setShowPdfViewer(true);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or phone number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {currentPatients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No patients found</p>
              {searchTerm && <p className="text-sm text-muted-foreground">Try searching with different criteria</p>}
            </CardContent>
          </Card>
        ) : (
          currentPatients.map(patient => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      <Badge variant="outline">{patient.id}</Badge>
                      <Badge className="bg-green-100 text-green-800">{patient.visits.length} visits</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <p className="font-medium">{patient.age} years</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <p className="font-medium">{patient.gender}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Latest Visit:</span>
                        <p className="font-medium">{patient.visits[patient.visits.length - 1]?.date || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className='cursor-pointer' onClick={() => setSelectedPatient(patient)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden pt-8">
                      {selectedPatient && selectedPatient.id === patient.id && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              {selectedPatient.name}
                            </DialogTitle>
                            <DialogDescription>
                              Patient ID: {selectedPatient.id} • {selectedPatient.visits.length} total visits
                            </DialogDescription>
                          </DialogHeader>

                          <div className="flex-1 overflow-y-auto pr-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style>{`::-webkit-scrollbar { display: none; }`}</style>

                            <div className="space-y-6">
                              {/* Patient Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Age</Label>
                                  <p className="font-medium">{selectedPatient.age} years</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Gender</Label>
                                  <p className="font-medium">{selectedPatient.gender}</p>
                                </div>

                              </div>

                              {/* Visit History */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">Visit History</Label>

                                <div className="space-y-3">
                                  {selectedPatient.visits.map((visit, idx) => (
                                    <div key={visit.visitId} className="p-4 bg-muted/50 rounded-lg border">
                                      <div className="flex justify-between items-start mb-3">
                                        <Badge variant="secondary">Visit #{selectedPatient.visits.length - idx}</Badge>
                                        <span className="text-xs text-muted-foreground">{visit.date}</span>
                                      </div>

                                      <p className="font-medium text-sm mb-2">{visit.reason}</p>
                                      <p className="text-xs text-muted-foreground mb-3">{visit.notes}</p>

                                      {/* PDF Report Button */}
                                      {visit.reportPdf && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleViewReport(visit.reportPdf)}
                                          className="w-full"
                                        >
                                          <FileText className="h-4 w-4 mr-2" />
                                          View Report PDF
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredPatients.length > 10 && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </Button>

          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden pt-8">
          <DialogHeader>
            <DialogTitle>Medical Report</DialogTitle>
            <button
              onClick={() => setShowPdfViewer(false)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full border rounded"
              style={{ scrollbarWidth: 'thin' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
